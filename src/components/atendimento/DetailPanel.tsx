import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";
import { Ticket, Motivo } from "@/hooks/useAtendimento";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface DetailPanelProps {
  ticket: Ticket;
  motivos: Motivo[];
  onTicketUpdate: () => void;
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

  useEffect(() => {
    setNome(ticket.contato?.nome || "");
    setEmpresa(ticket.contato?.empresa || "");
    setEmail(ticket.contato?.email || "");
    setNotas(ticket.contato?.notas || "");
    setTags(ticket.tags || []);
  }, [ticket]);

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

  // Debounced save for contato
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
    setTags(updated);
    setNewTag("");
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
  const slaColor = slaPercent < 80 ? "bg-green-500" : slaPercent < 100 ? "bg-amber-500" : "bg-destructive";

  return (
    <div className="w-[260px] shrink-0 border-l border-border/50 bg-card/20 overflow-y-auto p-4 space-y-5">
      {/* Contato */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contato</h4>
        <div className="space-y-2">
          <Input
            value={nome}
            onChange={e => setNome(e.target.value)}
            onBlur={() => saveContato("nome", nome)}
            placeholder="Nome"
            className="h-8 text-xs"
          />
          <Input
            value={empresa}
            onChange={e => setEmpresa(e.target.value)}
            onBlur={() => saveContato("empresa", empresa)}
            placeholder="Empresa"
            className="h-8 text-xs"
          />
          <Input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => saveContato("email", email)}
            placeholder="E-mail"
            className="h-8 text-xs"
          />
          <Textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Notas..."
            className="text-xs min-h-[60px] resize-none"
          />
        </div>
      </div>

      {/* Ticket */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Ticket</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Protocolo</span>
            <span className="font-mono">#{ticket.protocolo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Abertura</span>
            <span>{format(new Date(ticket.created_at), "dd/MM HH:mm")}</span>
          </div>
          {motivo && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Motivo</span>
              <Badge variant="outline" className="text-[10px] h-5" style={{ borderColor: motivo.cor_hex, color: motivo.cor_hex }}>
                {motivo.nome}
              </Badge>
            </div>
          )}
          {ticket.sla_deadline && (
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">SLA</span>
                <span className={`font-medium ${slaPercent >= 100 ? "text-destructive" : slaPercent >= 80 ? "text-amber-400" : "text-green-400"}`}>
                  {slaRemaining}
                </span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${slaColor} transition-all`} style={{ width: `${Math.min(slaPercent, 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tags</h4>
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-[10px] h-5 gap-1 pl-2 pr-1">
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAddTag(); }}
          placeholder="Adicionar tag..."
          className="h-7 text-xs"
        />
      </div>
    </div>
  );
}
