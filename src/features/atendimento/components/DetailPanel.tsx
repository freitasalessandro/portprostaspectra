import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Clock, Tag, UserCircle, FileText, ArrowRightLeft } from "lucide-react";
import { Ticket, Motivo } from "@/features/atendimento/hooks/useAtendimento";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface DetailPanelProps {
  ticket: Ticket;
  motivos: Motivo[];
  onTicketUpdate: () => void;
}

interface TransferRecord {
  id: string;
  from_atendente_id: string | null;
  to_atendente_id: string | null;
  motivo: string | null;
  created_at: string;
  from_nome?: string;
  to_nome?: string;
}

export default function DetailPanel({ ticket, motivos, onTicketUpdate }: DetailPanelProps) {
  const [nome, setNome] = useState(ticket.contato?.nome || "");
  const [empresa, setEmpresa] = useState(ticket.contato?.empresa || "");
  const [email, setEmail] = useState(ticket.contato?.email || "");
  const [notas, setNotas] = useState(ticket.contato?.notas || "");
  const [tags, setTags] = useState<string[]>(ticket.tags || []);
  const [newTag, setNewTag] = useState("");
  const [slaRemaining, setSlaRemaining] = useState("");
  const [slaPercent, setSlaPercent] = useState(0);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);

  useEffect(() => {
    setNome(ticket.contato?.nome || "");
    setEmpresa(ticket.contato?.empresa || "");
    setEmail(ticket.contato?.email || "");
    setNotas(ticket.contato?.notas || "");
    setTags(ticket.tags || []);
  }, [ticket]);

  // Fetch transfer history
  useEffect(() => {
    if (!ticket.id) return;
    const fetchTransfers = async () => {
      const { data } = await supabase
        .from("ticket_transfers")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      if (!data || data.length === 0) { setTransfers([]); return; }
      const ids = [...new Set([
        ...data.map(t => t.from_atendente_id).filter(Boolean),
        ...data.map(t => t.to_atendente_id).filter(Boolean),
      ])] as string[];
      const { data: atendentes } = ids.length > 0
        ? await supabase.from("atendentes_perfil").select("user_id, nome_completo").in("user_id", ids)
        : { data: [] as any[] };
      const nameMap: Record<string, string> = {};
      atendentes?.forEach(a => { nameMap[a.user_id] = a.nome_completo; });
      setTransfers(data.map(t => ({
        ...t,
        from_nome: t.from_atendente_id ? nameMap[t.from_atendente_id] || "—" : "Sem atendente",
        to_nome: t.to_atendente_id ? nameMap[t.to_atendente_id] || "—" : "Removido",
      })));
    };
    fetchTransfers();

    const channel = supabase
      .channel(`transfers-${ticket.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_transfers", filter: `ticket_id=eq.${ticket.id}` }, () => fetchTransfers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticket.id]);

  // SLA timer
  useEffect(() => {
    if (!ticket.sla_deadline) { setSlaRemaining("Sem SLA"); setSlaPercent(0); return; }
    const update = () => {
      const now = Date.now();
      const deadline = new Date(ticket.sla_deadline!).getTime();
      const created = new Date(ticket.created_at).getTime();
      const total = deadline - created;
      const elapsed = now - created;
      const pct = Math.min(Math.round((elapsed / total) * 100), 150);
      setSlaPercent(pct);
      const remaining = deadline - now;
      if (remaining > 0) {
        const mins = Math.floor(remaining / 60000);
        setSlaRemaining(`Restam ${mins}min`);
      } else {
        const overMins = Math.abs(Math.floor(remaining / 60000));
        setSlaRemaining(`VIOLADO há ${overMins}min`);
      }
    };
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, [ticket.sla_deadline, ticket.created_at]);

  const saveContato = useCallback(async (field: string, value: string) => {
    if (!ticket.contato_id) return;
    await supabase.from("contatos").update({ [field]: value }).eq("id", ticket.contato_id);
  }, [ticket.contato_id]);

  useEffect(() => {
    const t = setTimeout(() => { if (notas !== (ticket.contato?.notas || "")) saveContato("notas", notas); }, 1000);
    return () => clearTimeout(t);
  }, [notas, saveContato, ticket.contato?.notas]);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const updated = [...tags, newTag.trim()];
    setTags(updated); setNewTag("");
    await supabase.from("tickets").update({ tags: updated }).eq("id", ticket.id);
    onTicketUpdate();
  };

  const handleRemoveTag = async (tag: string) => {
    const updated = tags.filter(t => t !== tag);
    setTags(updated);
    await supabase.from("tickets").update({ tags: updated }).eq("id", ticket.id);
    onTicketUpdate();
  };

  const motivo = motivos.find(m => m.id === ticket.motivo_id);
  const slaColor = slaPercent < 80 ? "text-emerald-400" : slaPercent < 100 ? "text-amber-400" : "text-destructive";
  const slaBarColor = slaPercent < 80 ? "bg-emerald-500" : slaPercent < 100 ? "bg-amber-500" : "bg-destructive";

  return (
    <div className="w-[270px] shrink-0 border-l border-border/15 bg-card/15 backdrop-blur-sm overflow-y-auto">
      {/* ─── CONTATO ─── */}
      <div className="p-4 border-b border-border/10">
        <div className="flex items-center gap-2 mb-3">
          <UserCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50" style={{ fontFamily: "var(--font-display)" }}>
            Contato
          </h4>
        </div>
        <div className="space-y-2">
          <Input
            value={nome}
            onChange={e => setNome(e.target.value)}
            onBlur={() => saveContato("nome", nome)}
            placeholder="Nome"
            className="h-8 text-xs bg-secondary/15 border-border/15 rounded-lg placeholder:text-muted-foreground/30"
          />
          <Input
            value={empresa}
            onChange={e => setEmpresa(e.target.value)}
            onBlur={() => saveContato("empresa", empresa)}
            placeholder="Empresa"
            className="h-8 text-xs bg-secondary/15 border-border/15 rounded-lg placeholder:text-muted-foreground/30"
          />
          <Input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => saveContato("email", email)}
            placeholder="E-mail"
            className="h-8 text-xs bg-secondary/15 border-border/15 rounded-lg placeholder:text-muted-foreground/30"
          />
          <Textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Notas..."
            className="text-xs min-h-[60px] resize-none bg-secondary/15 border-border/15 rounded-lg placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      {/* ─── TICKET ─── */}
      <div className="p-4 border-b border-border/10">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-3.5 h-3.5 text-muted-foreground/50" />
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50" style={{ fontFamily: "var(--font-display)" }}>
            Ticket
          </h4>
        </div>
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground/60">Protocolo</span>
            <span className="font-mono text-foreground/70 bg-secondary/30 px-2 py-0.5 rounded">#{ticket.protocolo}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground/60">Abertura</span>
            <span className="text-foreground/70">{format(new Date(ticket.created_at), "dd/MM HH:mm")}</span>
          </div>
          {motivo && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground/60">Motivo</span>
              <Badge variant="outline" className="text-[10px] h-5 font-medium" style={{ borderColor: `${motivo.cor_hex}40`, color: motivo.cor_hex }}>
                {motivo.nome}
              </Badge>
            </div>
          )}
          {ticket.sla_deadline && (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-muted-foreground/50" />
                  <span className="text-muted-foreground/60">SLA</span>
                </div>
                <span className={`font-semibold text-[11px] ${slaColor}`}>
                  {slaRemaining}
                </span>
              </div>
              <div className="w-full h-1 bg-secondary/30 rounded-full overflow-hidden">
                <div
                  className={`h-full ${slaBarColor} transition-all duration-500 ease-out rounded-full`}
                  style={{ width: `${Math.min(slaPercent, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── TAGS ─── */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-3.5 h-3.5 text-muted-foreground/50" />
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50" style={{ fontFamily: "var(--font-display)" }}>
            Tags
          </h4>
        </div>
        <div className="flex flex-wrap gap-1 mb-2.5">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-[10px] h-5 gap-1 pl-2 pr-1 bg-secondary/30 border border-border/15 text-foreground/70">
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive transition-colors">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {tags.length === 0 && (
            <span className="text-[10px] text-muted-foreground/30 italic">Nenhuma tag</span>
          )}
        </div>
        <Input
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAddTag(); }}
          placeholder="Adicionar tag..."
          className="h-7 text-xs bg-secondary/15 border-border/15 rounded-lg placeholder:text-muted-foreground/30"
        />
      </div>

      {/* ─── TRANSFERÊNCIAS ─── */}
      {transfers.length > 0 && (
        <div className="p-4 border-t border-border/10">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground/50" />
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50" style={{ fontFamily: "var(--font-display)" }}>
              Transferências
            </h4>
          </div>
          <div className="space-y-2">
            {transfers.map((t, i) => (
              <div key={t.id} className="relative pl-4">
                {i < transfers.length - 1 && (
                  <div className="absolute left-[5px] top-4 bottom-0 w-px bg-border/20" />
                )}
                <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-primary/40 bg-card" />
                <div className="text-[10px] space-y-0.5">
                  <div className="text-muted-foreground/50">
                    {format(new Date(t.created_at), "dd/MM HH:mm")}
                  </div>
                  <div className="text-foreground/70">
                    <span className="text-muted-foreground/60">{t.from_nome}</span>
                    {" → "}
                    <span className="font-medium">{t.to_nome}</span>
                  </div>
                  {t.motivo && (
                    <div className="text-muted-foreground/60 italic mt-0.5">"{t.motivo}"</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
