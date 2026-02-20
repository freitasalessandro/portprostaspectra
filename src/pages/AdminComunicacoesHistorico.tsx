import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const EVENTS = [
  { value: "proposta_enviada", label: "Proposta enviada" },
  { value: "proposta_visualizada", label: "Proposta visualizada" },
  { value: "proposta_aprovada", label: "Proposta aprovada" },
  { value: "proposta_expirada", label: "Proposta expirada" },
];

interface HistoryEntry {
  id: string;
  event: string;
  destination_number: string;
  status: string;
  message_sent: string;
  error_details: string | null;
  created_at: string;
  proposals?: { client_name: string; project_title: string } | null;
}

const AdminComunicacoesHistorico = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEvent, setFilterEvent] = useState("");

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    let query = supabase
      .from("communication_history")
      .select("id, event, destination_number, status, message_sent, error_details, created_at, proposals(client_name, project_title)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (filterStatus) query = query.eq("status", filterStatus);
    if (filterEvent) query = query.eq("event", filterEvent);

    const { data } = await query;
    setEntries((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterStatus, filterEvent]);

  const eventLabel = (v: string) => EVENTS.find(e => e.value === v)?.label || v;

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
            <span className="w-6 h-px bg-primary/40" /> Comunicações
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Histórico</h1>
        </motion.div>

        <div className="flex gap-3 mb-4">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
            <option value="">Todos os status</option>
            <option value="enviado">Enviado</option>
            <option value="falhou">Falhou</option>
          </select>
          <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
            <option value="">Todos os eventos</option>
            {EVENTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-10">Carregando...</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">Nenhum registro encontrado.</p>
        ) : (
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposta</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">
                      {e.proposals ? `${e.proposals.client_name} — ${e.proposals.project_title}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{eventLabel(e.event)}</TableCell>
                    <TableCell className="font-mono text-xs">{e.destination_number}</TableCell>
                    <TableCell>
                      <Badge variant={e.status === "enviado" ? "default" : "destructive"} className="text-[10px]">
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate" title={e.message_sent}>{e.message_sent}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(e.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminComunicacoesHistorico;
