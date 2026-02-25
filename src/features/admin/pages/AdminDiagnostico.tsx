import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import AdminLayout from "@/features/admin/components/AdminLayout";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Shield, Key, User, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Session } from "@supabase/supabase-js";

const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${ok ? "bg-green-500/15 text-green-400" : "bg-destructive/15 text-destructive"}`}>
    {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {label}
  </span>
);

const AdminDiagnostico = () => {
  const { permissions, isAdmin, loading, initialized, userId, refreshPermissions } = useModuleAccess();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [roleRows, setRoleRows] = useState<any[]>([]);
  const [moduleRows, setModuleRows] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbErrors, setDbErrors] = useState<string[]>([]);

  const fetchSessionAndDb = async () => {
    setSessionLoading(true);
    setDbLoading(true);
    setDbErrors([]);

    const { data: { session: s } } = await supabase.auth.getSession();
    setSession(s);
    setSessionLoading(false);

    if (!s?.user) {
      setDbLoading(false);
      return;
    }

    const errors: string[] = [];

    const [rolesRes, modulesRes] = await Promise.all([
      supabase.from("user_roles").select("*").eq("user_id", s.user.id),
      supabase.from("user_module_access").select("*").eq("user_id", s.user.id),
    ]);

    if (rolesRes.error) errors.push(`user_roles: ${rolesRes.error.message}`);
    else setRoleRows(rolesRes.data ?? []);

    if (modulesRes.error) errors.push(`user_module_access: ${modulesRes.error.message}`);
    else setModuleRows(modulesRes.data ?? []);

    setDbErrors(errors);
    setDbLoading(false);
  };

  useEffect(() => {
    fetchSessionAndDb();
  }, []);

  const handleRefresh = async () => {
    await fetchSessionAndDb();
    await refreshPermissions();
  };

  const moduleKeys = Object.keys(permissions) as Array<keyof typeof permissions>;

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
                <span className="w-6 h-px bg-primary/40" /> Sistema
              </p>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">Diagnóstico de Autenticação</h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Hook State */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
          <div className="glass-card-premium p-6 space-y-4">
            <h2 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Estado do Provider (useModuleAccess)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Inicializado</p>
                <StatusBadge ok={initialized} label={initialized ? "Sim" : "Não"} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Carregando</p>
                <StatusBadge ok={!loading} label={loading ? "Sim" : "Não"} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Admin</p>
                <StatusBadge ok={isAdmin} label={isAdmin ? "Sim" : "Não"} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">User ID</p>
                <code className="text-[10px] font-mono text-foreground/70 block truncate">{userId ?? "—"}</code>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Session */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <div className="glass-card-premium p-6 space-y-4">
            <h2 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Sessão Ativa
            </h2>
            {sessionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary/40" />
            ) : session ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-body">
                <div><span className="text-muted-foreground/50">Email:</span> <span className="text-foreground">{session.user.email}</span></div>
                <div><span className="text-muted-foreground/50">ID:</span> <code className="font-mono text-foreground/70">{session.user.id}</code></div>
                <div><span className="text-muted-foreground/50">Provider:</span> <span className="text-foreground">{session.user.app_metadata?.provider ?? "—"}</span></div>
                <div><span className="text-muted-foreground/50">Token expira:</span> <span className="text-foreground">{session.expires_at ? new Date(session.expires_at * 1000).toLocaleString("pt-BR") : "—"}</span></div>
              </div>
            ) : (
              <p className="text-destructive text-sm">Nenhuma sessão ativa encontrada.</p>
            )}
          </div>
        </motion.div>

        {/* DB Queries */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
          <div className="glass-card-premium p-6 space-y-4">
            <h2 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" /> Consultas ao Banco
            </h2>

            {dbErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-1">
                {dbErrors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive font-mono">{err}</p>
                ))}
              </div>
            )}

            {dbLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary/40" />
            ) : (
              <>
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground/70 mb-2">user_roles ({roleRows.length} registros)</h3>
                  {roleRows.length === 0 ? (
                    <p className="text-xs text-muted-foreground/40">Nenhum role encontrado para este usuário.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <pre className="text-[10px] font-mono bg-muted/10 rounded-md p-3 max-h-32 overflow-y-auto">{JSON.stringify(roleRows, null, 2)}</pre>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground/70 mb-2">user_module_access ({moduleRows.length} registros)</h3>
                  {moduleRows.length === 0 ? (
                    <p className="text-xs text-muted-foreground/40">Nenhuma permissão modular encontrada.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <pre className="text-[10px] font-mono bg-muted/10 rounded-md p-3 max-h-48 overflow-y-auto">{JSON.stringify(moduleRows, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Resolved Permissions */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <div className="glass-card-premium p-6 space-y-4">
            <h2 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" /> Permissões Resolvidas (Provider)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="text-left py-2 px-3 text-muted-foreground/50 uppercase tracking-widest text-[10px]">Módulo</th>
                    <th className="text-center py-2 px-3 text-muted-foreground/50 uppercase tracking-widest text-[10px]">Ver</th>
                    <th className="text-center py-2 px-3 text-muted-foreground/50 uppercase tracking-widest text-[10px]">Criar</th>
                    <th className="text-center py-2 px-3 text-muted-foreground/50 uppercase tracking-widest text-[10px]">Editar</th>
                    <th className="text-center py-2 px-3 text-muted-foreground/50 uppercase tracking-widest text-[10px]">Excluir</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleKeys.map((key) => {
                    const p = permissions[key];
                    return (
                      <tr key={key} className="border-b border-border/10 hover:bg-muted/5">
                        <td className="py-2 px-3 font-mono font-semibold">{key}</td>
                        <td className="py-2 px-3 text-center">{p.can_view ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mx-auto" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground/20 mx-auto" />}</td>
                        <td className="py-2 px-3 text-center">{p.can_create ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mx-auto" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground/20 mx-auto" />}</td>
                        <td className="py-2 px-3 text-center">{p.can_edit ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mx-auto" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground/20 mx-auto" />}</td>
                        <td className="py-2 px-3 text-center">{p.can_delete ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mx-auto" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground/20 mx-auto" />}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDiagnostico;
