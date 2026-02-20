import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Search, Filter } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, any>;
  created_at: string;
  profile?: { display_name: string | null; email: string | null };
}

const actionLabels: Record<string, string> = {
  proposal_approval_revoked: "Aprovação revogada",
};

const AdminAuditoria = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [actions, setActions] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      fetchLogs();
    };
    init();
  }, [navigate]);

  const fetchLogs = async (action?: string, from?: Date, to?: Date) => {
    setLoading(true);
    let query = (supabase as any).from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);

    if (action && action !== "all") query = query.eq("action", action);
    if (from) query = query.gte("created_at", from.toISOString());
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endOfDay.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const logsData = (data || []) as AuditLog[];

    // Fetch profiles for user names
    const userIds = [...new Set(logsData.map(l => l.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", userIds);

      const profileMap: Record<string, { display_name: string | null; email: string | null }> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
      logsData.forEach(l => { l.profile = profileMap[l.user_id]; });
    }

    // Extract unique actions for filter
    const uniqueActions = [...new Set(logsData.map(l => l.action))];
    setActions(prev => {
      const merged = [...new Set([...prev, ...uniqueActions])];
      return merged;
    });

    setLogs(logsData);
    setLoading(false);
  };

  const handleFilter = () => {
    fetchLogs(actionFilter, dateFrom, dateTo);
  };

  const handleClear = () => {
    setActionFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    fetchLogs();
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
            <span className="w-6 h-px bg-primary/40" />
            Sistema
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Auditoria</h1>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="glass-card p-4 mb-6 flex flex-wrap items-end gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">Ação</label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {actions.map(a => (
                  <SelectItem key={a} value={a}>{actionLabels[a] || a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">De</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-9 w-[140px] text-xs justify-start", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">Até</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-9 w-[140px] text-xs justify-start", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy") : "Fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <Button size="sm" onClick={handleFilter} className="h-9 text-xs font-display uppercase tracking-widest">
            <Filter className="w-3 h-3 mr-1" /> Filtrar
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClear} className="h-9 text-xs">
            Limpar
          </Button>
        </motion.div>

        {/* Logs */}
        {loading ? (
          <div className="text-center text-muted-foreground/40 py-20 font-body text-sm">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="glass-card-premium p-10 text-center">
            <p className="text-muted-foreground/50 font-body text-sm">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="visible">
            {logs.map((log) => (
              <motion.div
                key={log.id}
                variants={fadeUp}
                className="glass-card p-4 hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm font-bold bg-primary/10 text-primary">
                        {actionLabels[log.action] || log.action}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm font-bold bg-muted text-muted-foreground">
                        {log.entity_type}
                      </span>
                    </div>

                    <p className="text-sm font-body text-foreground/80">
                      <span className="font-semibold">{log.profile?.display_name || log.profile?.email || "Usuário"}</span>
                      {" — "}
                      {log.metadata?.project_title && (
                        <span className="text-muted-foreground">
                          {log.metadata.project_title}
                          {log.metadata.client_name && ` (${log.metadata.client_name})`}
                        </span>
                      )}
                    </p>

                    {log.metadata?.revoked_signature && (
                      <div className="mt-2 text-xs font-body text-muted-foreground/60 space-y-0.5">
                        <p>Assinante: {log.metadata.revoked_signature.signer_name}</p>
                        <p>Assinado em: {new Date(log.metadata.revoked_signature.signed_at).toLocaleString("pt-BR")}</p>
                        <p className="font-mono text-[10px] break-all">Hash: {log.metadata.revoked_signature.signature_hash}</p>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground/60 font-body">
                      {new Date(log.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-[10px] text-muted-foreground/40 font-mono">
                      {new Date(log.created_at).toLocaleTimeString("pt-BR")}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAuditoria;
