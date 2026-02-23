import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Send, PauseCircle, XCircle, ChevronRight, ChevronLeft, Check, CheckCheck, Star,
} from "lucide-react";
import { Ticket, Mensagem, Motivo, AtendentePerfil } from "@/hooks/useAtendimento";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatAreaProps {
  ticket: Ticket | null;
  mensagens: Mensagem[];
  loadingMensagens: boolean;
  motivos: Motivo[];
  perfil: AtendentePerfil | null;
  showPanel: boolean;
  onTogglePanel: () => void;
  onTicketUpdate: () => void;
}

function formatPhone(n: string) {
  if (!n) return "";
  const clean = n.replace(/\D/g, "");
  if (clean.length === 13) return `+${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 9)}-${clean.slice(9)}`;
  return n;
}

function groupByDate(msgs: Mensagem[]) {
  const groups: { label: string; msgs: Mensagem[] }[] = [];
  let currentLabel = "";
  for (const m of msgs) {
    const d = new Date(m.created_at);
    let label = format(d, "dd/MM/yyyy");
    if (isToday(d)) label = "Hoje";
    else if (isYesterday(d)) label = "Ontem";
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, msgs: [] });
    }
    groups[groups.length - 1].msgs.push(m);
  }
  return groups;
}

function StatusIcon({ status }: { status: string | null }) {
  if (status === "ENVIANDO") return <span className="text-muted-foreground text-[10px]">⏳</span>;
  if (status === "ENVIADO") return <Check className="w-3 h-3 text-muted-foreground" />;
  if (status === "ENTREGUE") return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
  if (status === "LIDO") return <CheckCheck className="w-3 h-3 text-blue-400" />;
  if (status === "ERRO") return <span className="text-destructive text-[10px]">✕</span>;
  return null;
}

export default function ChatArea({
  ticket, mensagens, loadingMensagens, motivos, perfil, showPanel, onTogglePanel, onTicketUpdate,
}: ChatAreaProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const handleSend = async () => {
    if (!text.trim() || !ticket || !perfil) return;
    setSending(true);

    const sig = perfil.assinatura_ativa && perfil.assinatura_padrao
      ? `\n\n${perfil.assinatura_padrao}`
      : "";

    // Insert message locally
    const { error } = await supabase.from("mensagens").insert({
      ticket_id: ticket.id,
      sentido: "SAIDA",
      tipo: "TEXT",
      conteudo: text.trim(),
      atendente_id: perfil.id,
      assinatura: perfil.assinatura_ativa ? perfil.assinatura_padrao : null,
      status_envio: "ENVIADO",
    });

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      // Update ticket status if needed
      if (ticket.status === "ABERTO") {
        await supabase.from("tickets").update({
          status: "EM_ATENDIMENTO" as any,
          atendente_id: perfil.id,
          assumed_at: new Date().toISOString(),
        }).eq("id", ticket.id);
      }
      setText("");
      onTicketUpdate();
    }
    setSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    await supabase.from("tickets").update({ status: newStatus as any }).eq("id", ticket.id);
    onTicketUpdate();
  };

  const handleClose = async () => {
    if (!ticket) return;
    await supabase.from("tickets").update({
      status: "ENCERRADO",
      avaliacao: rating || null,
    }).eq("id", ticket.id);
    setCloseDialog(false);
    setRating(0);
    onTicketUpdate();
    toast({ title: "Ticket encerrado" });
  };

  const handleMotivoChange = async (motivoId: string) => {
    if (!ticket) return;
    await supabase.from("tickets").update({ motivo_id: motivoId }).eq("id", ticket.id);
    onTicketUpdate();
  };

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium mb-1">Selecione um ticket</p>
          <p className="text-sm">Escolha uma conversa na lista ao lado</p>
        </div>
      </div>
    );
  }

  const motivo = motivos.find(m => m.id === ticket.motivo_id);
  const groups = groupByDate(mensagens);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border/30 bg-card/20 shrink-0">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold shrink-0">
          {(ticket.contato?.nome || ticket.whatsapp_number).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{ticket.contato?.nome || ticket.whatsapp_number}</p>
          <p className="text-[11px] text-muted-foreground">{formatPhone(ticket.whatsapp_number)} · <span className="text-muted-foreground/60">#{ticket.protocolo}</span></p>
        </div>

        <Select value={ticket.motivo_id || ""} onValueChange={handleMotivoChange}>
          <SelectTrigger className="w-[140px] h-7 text-xs">
            <SelectValue placeholder="Motivo" />
          </SelectTrigger>
          <SelectContent>
            {motivos.map(m => (
              <SelectItem key={m.id} value={m.id}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.cor_hex }} />
                  {m.nome}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {ticket.status !== "ENCERRADO" && ticket.status !== "CANCELADO" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-amber-400 hover:bg-amber-500/10"
              onClick={() => handleStatusChange("AGUARDANDO")}
            >
              <PauseCircle className="w-3.5 h-3.5 mr-1" /> Aguardar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:bg-destructive/10"
              onClick={() => setCloseDialog(true)}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" /> Encerrar
            </Button>
          </>
        )}

        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onTogglePanel}>
          {showPanel ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {loadingMensagens ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <Skeleton className="h-10 w-48 rounded-xl" />
            </div>
          ))
        ) : (
          groups.map((group, gi) => (
            <div key={gi}>
              <div className="flex items-center justify-center my-3">
                <span className="text-[11px] text-muted-foreground bg-card/60 px-3 py-1 rounded-full">{group.label}</span>
              </div>
              {group.msgs.map(msg => {
                if (msg.sentido === "SISTEMA") {
                  return (
                    <div key={msg.id} className="text-center my-2">
                      <span className="text-[11px] text-muted-foreground italic">{msg.conteudo}</span>
                    </div>
                  );
                }

                const isOut = msg.sentido === "SAIDA";
                return (
                  <div key={msg.id} className={`flex mb-1.5 ${isOut ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] px-3 py-2 text-sm ${
                        isOut
                          ? "bg-primary text-primary-foreground rounded-xl rounded-tr-none"
                          : "bg-secondary text-foreground rounded-xl rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isOut ? "justify-end" : "justify-start"}`}>
                        <span className={`text-[10px] ${isOut ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {format(new Date(msg.created_at), "HH:mm")}
                        </span>
                        {isOut && <StatusIcon status={msg.status_envio} />}
                      </div>
                      {isOut && msg.assinatura && (
                        <p className={`text-[10px] mt-0.5 ${isOut ? "text-primary-foreground/40" : "text-muted-foreground/60"}`}>
                          — {msg.assinatura}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Input bar */}
      {ticket.status !== "ENCERRADO" && ticket.status !== "CANCELADO" && (
        <div className="p-3 border-t border-border/30 bg-card/20 shrink-0">
          <div className="flex items-end gap-2">
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem..."
              className="min-h-[36px] max-h-[120px] resize-none text-sm bg-background/50"
              rows={1}
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={!text.trim() || sending}
              onClick={handleSend}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {perfil?.assinatura_ativa && perfil.assinatura_padrao && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Assinando como: {perfil.nome_completo} | {perfil.setor}
            </p>
          )}
        </div>
      )}

      {/* Close dialog */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar ticket #{ticket.protocolo}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">Avaliação do atendimento (opcional):</p>
          <div className="flex gap-1 justify-center">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className="p-1 transition-colors"
              >
                <Star
                  className={`w-7 h-7 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
                />
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCloseDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleClose}>Encerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
