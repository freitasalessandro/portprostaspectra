import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/features/admin/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cargoLabels, cargoColors, type AtendenteCargo } from "@/features/atendimento/hooks/useAtendimento";
import UserPermissionsDialog from "@/features/admin/components/UserPermissionsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { Plus, Trash2, Shield, Mail, Loader2, Lock, KeyRound } from "lucide-react";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  role: string;
  cargo: AtendenteCargo;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Visualizador",
};

const roleColors: Record<string, string> = {
  admin: "bg-primary/15 text-primary",
  editor: "bg-accent/50 text-accent-foreground",
  viewer: "bg-muted text-muted-foreground",
};

const AdminUsuarios = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteTab, setInviteTab] = useState("invite");
  const [inviting, setInviting] = useState(false);
  const [permUserId, setPermUserId] = useState<string | null>(null);
  const [permUserName, setPermUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setCurrentUserId(session.user.id);
      fetchUsers();
    };
    init();
  }, [navigate]);

  const fetchUsers = async () => {
    const [profilesRes, rolesRes, atendenteRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, email, avatar_url, created_at"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("atendentes_perfil").select("user_id, cargo"),
    ]);

    if (profilesRes.error) {
      toast({ title: "Erro", description: profilesRes.error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const roleMap: Record<string, string> = {};
    ((rolesRes.data as any[]) || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

    const cargoMap: Record<string, AtendenteCargo> = {};
    ((atendenteRes.data as any[]) || []).forEach((a: any) => { cargoMap[a.user_id] = a.cargo || "n1_triagem"; });

    const merged: UserProfile[] = ((profilesRes.data as any[]) || []).map((p: any) => ({
      ...p,
      role: roleMap[p.user_id] || "viewer",
      cargo: cargoMap[p.user_id] || "n1_triagem",
    }));

    merged.sort((a, b) => {
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (b.role === "admin" && a.role !== "admin") return 1;
      return (a.display_name || a.email || "").localeCompare(b.display_name || b.email || "");
    });

    setUsers(merged);
    setLoading(false);
  };

  const handleSubmitUser = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);

    try {
      const isCreate = inviteTab === "create";
      const payload: any = {
        action: isCreate ? "create" : "invite",
        email: inviteEmail.trim(),
        display_name: inviteName.trim(),
        role: inviteRole,
      };
      if (isCreate) payload.password = invitePassword;

      const { data, error } = await supabase.functions.invoke("manage-users", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: isCreate ? "Usuário criado!" : "Convite enviado!", description: `${inviteEmail}` });
      resetInviteForm();
      fetchUsers();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setInviting(false);
  };

  const resetInviteForm = () => {
    setShowInvite(false);
    setInviteEmail("");
    setInviteName("");
    setInviteRole("viewer");
    setInvitePassword("");
    setInviteTab("invite");
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário? Essa ação é irreversível.")) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "delete", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Usuário removido" });
      fetchUsers();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "update_role", user_id: userId, new_role: newRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Papel atualizado" });
      fetchUsers();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleCargoChange = async (userId: string, newCargo: AtendenteCargo) => {
    try {
      const { error } = await supabase
        .from("atendentes_perfil")
        .update({ cargo: newCargo as any })
        .eq("user_id", userId);

      if (error) {
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
        await supabase.from("atendentes_perfil").insert({
          id: userId,
          user_id: userId,
          nome_completo: (profile as any)?.display_name || "Atendente",
          cargo: newCargo as any,
        } as any);
      }

      toast({ title: "Cargo atualizado" });
      fetchUsers();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
              <span className="w-6 h-px bg-primary/40" />
              Equipe
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Usuários & Permissões</h1>
          </div>
          <Button
            onClick={() => setShowInvite(true)}
            className="font-display uppercase tracking-[0.2em] text-[10px] py-5 px-6 relative overflow-hidden group glow-box"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Usuário
            </span>
          </Button>
        </motion.div>

        {loading ? (
          <div className="text-center text-muted-foreground/40 py-20 font-body text-sm">Carregando...</div>
        ) : (
          <motion.div className="grid gap-3" variants={staggerContainer} initial="hidden" animate="visible">
            {users.map((u) => (
              <motion.div
                key={u.user_id}
                variants={fadeUp}
                className="glass-card-premium p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/30 to-transparent transition-all duration-500" />

                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-display font-bold text-xs sm:text-sm">
                    {(u.display_name || u.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-xs sm:text-sm truncate">
                        {u.display_name || "Sem nome"}
                      </h3>
                      {u.user_id === currentUserId && (
                        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-bold">
                          Você
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground/60 font-body flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{u.email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
                  {/* Cargo */}
                  <Select value={u.cargo} onValueChange={(val) => handleCargoChange(u.user_id, val as AtendenteCargo)}>
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="n1_triagem">N1 · Triagem</SelectItem>
                      <SelectItem value="n2_tecnico">N2 · Técnico</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Role */}
                  {u.user_id === currentUserId ? (
                    <span className={`text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-sm font-bold ${roleColors[u.role]}`}>
                      <Shield className="w-3 h-3 inline mr-1" />
                      {roleLabels[u.role]}
                    </span>
                  ) : (
                    <Select value={u.role} onValueChange={(val) => handleRoleChange(u.user_id, val)}>
                      <SelectTrigger className="w-[120px] h-8 text-xs font-display uppercase tracking-widest">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Permissions button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => { setPermUserId(u.user_id); setPermUserName(u.display_name || u.email || "Usuário"); }}
                    title="Permissões por módulo"
                    className="w-8 h-8 text-muted-foreground/60 hover:text-primary hover:border-primary/30"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </Button>

                  {/* Delete */}
                  {u.user_id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(u.user_id)}
                      title="Remover usuário"
                      className="w-8 h-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Create/Invite dialog */}
        <Dialog open={showInvite} onOpenChange={(v) => { if (!v) resetInviteForm(); else setShowInvite(true); }}>
          <DialogContent className="glass-card border-border/30 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Novo Usuário</DialogTitle>
              <DialogDescription className="text-muted-foreground/60">
                Crie diretamente ou envie um convite por e-mail.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={inviteTab} onValueChange={setInviteTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="invite" className="text-xs gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Convite
                </TabsTrigger>
                <TabsTrigger value="create" className="text-xs gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Criar com Senha
                </TabsTrigger>
              </TabsList>

              <div className="space-y-3 pt-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">E-mail *</label>
                  <Input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    type="email"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Nome</label>
                  <Input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Nome completo"
                    className="text-sm"
                  />
                </div>

                <TabsContent value="create" className="mt-0 pt-0">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Senha *</label>
                    <Input
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      type="password"
                      className="text-sm"
                    />
                  </div>
                </TabsContent>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Papel</label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin — acesso total</SelectItem>
                      <SelectItem value="editor">Editor — pode criar e editar</SelectItem>
                      <SelectItem value="viewer">Visualizador — somente leitura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={resetInviteForm}>Cancelar</Button>
              <Button
                onClick={handleSubmitUser}
                disabled={inviting || !inviteEmail.trim() || (inviteTab === "create" && invitePassword.length < 6)}
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : inviteTab === "create" ? <Lock className="w-4 h-4 mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                {inviteTab === "create" ? "Criar usuário" : "Enviar convite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Permissions dialog */}
        <UserPermissionsDialog
          open={!!permUserId}
          onOpenChange={(v) => { if (!v) { setPermUserId(null); setPermUserName(""); } }}
          userId={permUserId || ""}
          userName={permUserName}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsuarios;
