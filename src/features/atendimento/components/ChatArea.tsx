import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, PauseCircle, XCircle, ChevronRight, ChevronLeft, Check, CheckCheck, Star, Zap, Loader2, Paperclip, FileText, X, Download, Wifi, WifiOff, UserCheck, MessageSquare, ArrowLeft, Forward,
} from "lucide-react";
import { Ticket, Mensagem, Motivo, AtendentePerfil } from "@/features/atendimento/hooks/useAtendimento";
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
  onBack?: () => void;
}

interface PendingFile {
  file: File;
  preview: string | null;
  tipo: "IMAGE" | "DOCUMENT" | "AUDIO" | "VIDEO";
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
  if (status === "ENVIANDO") return <Loader2 className="w-3 h-3 text-primary-foreground/40 animate-spin" />;
  if (status === "ENVIADO") return <Check className="w-3 h-3 text-primary-foreground/50" />;
  if (status === "ENTREGUE") return <CheckCheck className="w-3 h-3 text-primary-foreground/50" />;
  if (status === "LIDO") return <CheckCheck className="w-3 h-3 text-accent" />;
  if (status === "ERRO") return <XCircle className="w-3 h-3 text-destructive" />;
  return null;
}

function getFileType(file: File): PendingFile["tipo"] {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("video/")) return "VIDEO";
  if (file.type.startsWith("audio/")) return "AUDIO";
  return "DOCUMENT";
}

function MediaBubble({ msg, onImageClick }: { msg: Mensagem; onImageClick?: (url: string) => void }) {
  const isSticker = msg.tipo === "IMAGE" && msg.midia_url && msg.midia_url.match(/\.webp/i) && !msg.conteudo;

  if (msg.tipo === "IMAGE" && msg.midia_url) {
    return (
      <div className="space-y-1.5">
        <img
          src={msg.midia_url}
          alt={isSticker ? "Figurinha" : "Imagem"}
          className={`rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${
            isSticker ? "max-w-[160px] bg-transparent" : "max-w-full shadow-sm"
          }`}
          style={isSticker ? {} : { maxHeight: 280 }}
          onClick={() => onImageClick?.(msg.midia_url!)}
        />
        {msg.conteudo && <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{msg.conteudo}</p>}
      </div>
    );
  }

  if (msg.tipo === "AUDIO" && msg.midia_url) {
    return (
      <div className="space-y-1.5 min-w-[220px]">
        <audio controls preload="metadata" className="w-full max-w-[300px] h-10 rounded-lg" style={{ filter: "saturate(0.8)" }}>
          <source src={msg.midia_url} />
          Seu navegador não suporta áudio.
        </audio>
        {msg.conteudo && <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{msg.conteudo}</p>}
      </div>
    );
  }

  if (msg.tipo === "VIDEO" && msg.midia_url) {
    return (
      <div className="space-y-1.5">
        <video
          controls
          preload="metadata"
          className="max-w-full rounded-lg shadow-sm"
          style={{ maxHeight: 280 }}
        >
          <source src={msg.midia_url} />
          Seu navegador não suporta vídeo.
        </video>
        {msg.conteudo && <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{msg.conteudo}</p>}
      </div>
    );
  }

  if (msg.tipo === "DOCUMENT" && msg.midia_url) {
    const fileName = msg.midia_url.split("/").pop() || "Arquivo";
    const isOut = msg.sentido === "SAIDA";
    return (
      <div className="space-y-1.5">
        <a
          href={msg.midia_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
            isOut ? "bg-primary-foreground/10 hover:bg-primary-foreground/15" : "bg-background/40 hover:bg-background/60"
          }`}
        >
          <FileText className="w-4 h-4 shrink-0 opacity-70" />
          <span className="text-xs truncate flex-1 font-medium">{decodeURIComponent(fileName)}</span>
          <Download className="w-3.5 h-3.5 shrink-0 opacity-50" />
        </a>
        {msg.conteudo && <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{msg.conteudo}</p>}
      </div>
    );
  }

  return <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{msg.conteudo}</p>;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ABERTO: { label: "Aberto", className: "bg-accent/15 text-accent border-accent/25" },
  EM_ATENDIMENTO: { label: "Atendendo", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  AGUARDANDO: { label: "Aguardando", className: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  ENCERRADO: { label: "Encerrado", className: "bg-muted text-muted-foreground border-border" },
  CANCELADO: { label: "Cancelado", className: "bg-destructive/15 text-destructive border-destructive/25" },
};

export default function ChatArea({
  ticket, mensagens, loadingMensagens, motivos, perfil, showPanel, onTogglePanel, onTicketUpdate, onBack,
}: ChatAreaProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [quickReplies, setQuickReplies] = useState<{ id: string; nome: string; conteudo: string; categoria: string }[]>([]);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [instanceInfo, setInstanceInfo] = useState<{ name: string; url: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [forwardDialog, setForwardDialog] = useState(false);
  const [atendentes, setAtendentes] = useState<{ id: string; user_id: string; nome_completo: string; cargo: string; setor: string | null }[]>([]);
  const [forwardTarget, setForwardTarget] = useState("");
  const [forwardMotivo, setForwardMotivo] = useState("");
  const [forwarding, setForwarding] = useState(false);
  const dragCounter = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    (supabase.from("respostas_rapidas" as any).select("*").eq("ativo", true).order("nome") as any).then(({ data }: any) => {
      if (data) setQuickReplies(data);
    });
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setCurrentUserId(null);
        setInstanceInfo(null);
        return;
      }

      setCurrentUserId(data.user.id);

      const { data: settings } = await supabase
        .from("company_settings")
        .select("atendimento_api_instance, atendimento_api_url")
        .eq("user_id", data.user.id)
        .maybeSingle();
      const s = settings as any;
      if (s?.atendimento_api_instance) {
        setInstanceInfo({
          name: s.atendimento_api_instance,
          url: (s.atendimento_api_url || "").replace(/\/+$/, ""),
        });
      } else {
        setInstanceInfo(null);
      }
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearPendingFile = () => {
    if (pendingFile?.preview) URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
  };

  const processFile = (file: File) => {
    if (file.size > 16 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 16MB", variant: "destructive" });
      return;
    }
    const tipo = getFileType(file);
    const preview = tipo === "IMAGE" ? URL.createObjectURL(file) : null;
    setPendingFile({ file, preview, tipo });
  };

  const handleDragEnter = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.items?.length) setDragging(true); };
  const handleDragLeave = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setDragging(false); };
  const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(false); dragCounter.current = 0; const file = e.dataTransfer.files?.[0]; if (file) processFile(file); };

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${ticket!.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("chat-media").upload(path, file, { contentType: file.type, upsert: false });
    if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); return null; }
    const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSend = async () => {
    if ((!text.trim() && !pendingFile) || !ticket) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !session.user?.id) {
        toast({ title: "Erro", description: "Sessão expirada.", variant: "destructive" });
        setSending(false);
        return;
      }

      let midiaUrl: string | null = null;
      let tipo = "TEXT";
      if (pendingFile) {
        midiaUrl = await uploadFile(pendingFile.file);
        if (!midiaUrl) {
          setSending(false);
          return;
        }
        tipo = pendingFile.tipo;
      }

      const { error } = await supabase.functions.invoke("send-message", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          ticket_id: ticket.id,
          conteudo: text.trim() || null,
          atendente_id: session.user.id,
          tipo,
          midia_url: midiaUrl,
        },
      });

      if (error) {
        toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
      } else {
        setText("");
        clearPendingFile();
        onTicketUpdate();
      }
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message || "Falha no envio", variant: "destructive" });
    }
    setSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleAssumir = async () => {
    if (!ticket) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      toast({ title: "Sessão expirada", description: "Faça login novamente.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({ atendente_id: user.id, status: "EM_ATENDIMENTO" as any, assumed_at: new Date().toISOString() })
      .eq("id", ticket.id);

    if (error) {
      toast({ title: "Erro ao assumir ticket", description: error.message, variant: "destructive" });
      return;
    }

    onTicketUpdate();
    toast({ title: "Ticket assumido com sucesso" });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    await supabase.from("tickets").update({ status: newStatus as any }).eq("id", ticket.id);
    onTicketUpdate();
  };

  const handleClose = async () => {
    if (!ticket) return;
    await supabase.from("tickets").update({ status: "ENCERRADO", avaliacao: rating || null }).eq("id", ticket.id);
    setCloseDialog(false); setRating(0); onTicketUpdate();
    toast({ title: "Ticket encerrado" });
  };

  const handleMotivoChange = async (motivoId: string) => {
    if (!ticket) return;
    await supabase.from("tickets").update({ motivo_id: motivoId }).eq("id", ticket.id);
    onTicketUpdate();
  };

  const openForwardDialog = async () => {
    const { data } = await supabase.from("atendentes_perfil").select("id, user_id, nome_completo, cargo, setor");
    setAtendentes((data || []).filter(a => a.user_id !== currentUserId));
    setForwardTarget("");
    setForwardMotivo("");
    setForwardDialog(true);
  };

  const handleForward = async () => {
    if (!ticket || !forwardTarget) return;
    setForwarding(true);
    const target = atendentes.find(a => a.user_id === forwardTarget);
    const motivoText = forwardMotivo.trim();
    await supabase.from("tickets").update({ atendente_id: forwardTarget, status: "EM_ATENDIMENTO" as any }).eq("id", ticket.id);
    // Update the auto-created transfer record with motivo
    if (motivoText) {
      const { data: latestTransfer } = await supabase
        .from("ticket_transfers")
        .select("id")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestTransfer) {
        await supabase.from("ticket_transfers").update({ motivo: motivoText }).eq("id", latestTransfer.id);
      }
    }
    // Insert system message
    const msgContent = motivoText
      ? `Ticket encaminhado para ${target?.nome_completo || "outro atendente"}\nMotivo: ${motivoText}`
      : `Ticket encaminhado para ${target?.nome_completo || "outro atendente"}`;
    await supabase.from("mensagens").insert({
      ticket_id: ticket.id,
      sentido: "SISTEMA" as any,
      tipo: "TEXT" as any,
      conteudo: msgContent,
    });
    setForwardDialog(false);
    setForwarding(false);
    onTicketUpdate();
    toast({ title: `Encaminhado para ${target?.nome_completo}` });
  };

  // Empty state
  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto">
            <MessageSquare className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground/80" style={{ fontFamily: "var(--font-display)" }}>
              Selecione um ticket
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha uma conversa na lista ao lado
            </p>
          </div>
        </div>
      </div>
    );
  }

  const motivo = motivos.find(m => m.id === ticket.motivo_id);
  const status = statusConfig[ticket.status] || statusConfig.ABERTO;
  const groups = groupByDate(mensagens);
  const allImageUrls = mensagens.filter(m => m.tipo === "IMAGE" && m.midia_url).map(m => m.midia_url!);
  const openLightbox = (url: string) => { const idx = allImageUrls.indexOf(url); setLightboxIndex(idx >= 0 ? idx : null); };

  return (
    <div
      className="flex-1 flex flex-col min-w-0 h-full relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 z-50 bg-primary/5 border-2 border-dashed border-primary/40 rounded-lg flex items-center justify-center backdrop-blur-md">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Paperclip className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-primary">Solte o arquivo aqui</p>
          </div>
        </div>
      )}

      {/* ─── HEADER ─── */}
      <div className="shrink-0 border-b border-border/20">
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Back button (mobile) */}
          {onBack && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 md:hidden" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold text-primary border border-primary/10">
              {(ticket.contato?.nome || ticket.whatsapp_number).charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs sm:text-sm font-semibold truncate" style={{ fontFamily: "var(--font-display)" }}>
                {ticket.contato?.nome || ticket.whatsapp_number}
              </p>
              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-[16px] font-medium shrink-0 ${status.className}`}>
                {status.label}
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground/60 font-mono hidden sm:inline">#{ticket.protocolo}</span>
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Select value={ticket.motivo_id || ""} onValueChange={handleMotivoChange}>
              <SelectTrigger className="w-[80px] sm:w-[100px] lg:w-[130px] h-7 text-[10px] bg-secondary/40 border-border/30">
                <SelectValue placeholder="Motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivos.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.cor_hex }} />
                      {m.nome}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {ticket.status !== "ENCERRADO" && ticket.status !== "CANCELADO" && (
              <div className="flex items-center gap-0.5">
                {(!ticket.atendente_id || ticket.status === "ABERTO") && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/10" onClick={handleAssumir} title="Assumir">
                    <UserCheck className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={openForwardDialog} title="Encaminhar">
                  <Forward className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-400 hover:bg-amber-500/10" onClick={() => handleStatusChange("AGUARDANDO")} title="Aguardar">
                  <PauseCircle className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setCloseDialog(true)} title="Encerrar">
                  <XCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hidden lg:flex" onClick={onTogglePanel}>
              {showPanel ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Connection status */}
        <div className="px-3 pb-1.5">
          <div className={`flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-md w-fit ${
            instanceInfo ? "bg-emerald-500/8 text-emerald-400/80" : "bg-destructive/8 text-destructive/80"
          }`}>
            {instanceInfo ? (
              <><Wifi className="w-2.5 h-2.5" /><span>{instanceInfo.name}</span></>
            ) : (
              <><WifiOff className="w-2.5 h-2.5" /><span>Sem instância</span></>
            )}
          </div>
        </div>
      </div>

      {/* ─── MESSAGES ─── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {loadingMensagens ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-52" : "w-44"}`} />
              </div>
            ))}
          </div>
        ) : mensagens.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto" />
              <p className="text-sm text-muted-foreground/50">Nenhuma mensagem ainda</p>
            </div>
          </div>
        ) : (
          groups.map((group, gi) => (
            <div key={gi}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border/20" />
                <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">{group.label}</span>
                <div className="flex-1 h-px bg-border/20" />
              </div>

              {group.msgs.map(msg => {
                if (msg.sentido === "SISTEMA") {
                  return (
                    <div key={msg.id} className="flex justify-center my-3">
                      <span className="text-[11px] text-muted-foreground/50 italic bg-secondary/30 px-3 py-1 rounded-full">
                        {msg.conteudo}
                      </span>
                    </div>
                  );
                }

                const isOut = msg.sentido === "SAIDA";
                return (
                  <div key={msg.id} className={`flex mb-2 ${isOut ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[65%] px-3 py-2 sm:px-3.5 sm:py-2.5 ${
                        isOut
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm shadow-primary/10"
                          : "bg-secondary/60 text-foreground rounded-2xl rounded-bl-md border border-border/20"
                      }`}
                    >
                      {isOut && msg.assinatura && (
                        <p className={`text-[11px] font-bold mb-0.5 ${isOut ? "text-primary-foreground/80" : "text-foreground/80"}`}>
                          {msg.assinatura}:
                        </p>
                      )}
                      <MediaBubble msg={msg} onImageClick={openLightbox} />
                      <div className={`flex items-center gap-1.5 mt-1 ${isOut ? "justify-end" : "justify-start"}`}>
                        <span className={`text-[10px] ${isOut ? "text-primary-foreground/50" : "text-muted-foreground/60"}`}>
                          {format(new Date(msg.created_at), "HH:mm")}
                        </span>
                        {isOut && <StatusIcon status={msg.status_envio} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-end mb-2">
            <div className="max-w-[65%] px-3.5 py-2.5 bg-primary/50 text-primary-foreground rounded-2xl rounded-br-md">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs opacity-70">Enviando...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── INPUT BAR ─── */}
      {ticket.status !== "ENCERRADO" && ticket.status !== "CANCELADO" && (
        <div className="shrink-0 border-t border-border/20 bg-card/40 backdrop-blur-sm">
          {/* File preview */}
          {pendingFile && (
            <div className="mx-4 mt-3 p-2.5 bg-secondary/30 rounded-xl border border-border/20 flex items-center gap-3">
              {pendingFile.tipo === "IMAGE" && pendingFile.preview ? (
                <img src={pendingFile.preview} alt="Preview" className="w-14 h-14 object-cover rounded-lg" />
              ) : (
                <div className="w-12 h-12 bg-secondary/50 rounded-lg flex items-center justify-center">
                  {pendingFile.tipo === "AUDIO" ? "🎵" : pendingFile.tipo === "VIDEO" ? "🎬" : <FileText className="w-5 h-5 text-muted-foreground" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{pendingFile.file.name}</p>
                <p className="text-[10px] text-muted-foreground">{(pendingFile.file.size / 1024).toFixed(0)} KB</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={clearPendingFile}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          <div className="flex items-end gap-2 p-3">
            {/* Quick replies */}
            <Popover open={quickOpen} onOpenChange={setQuickOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl" title="Respostas rápidas">
                  <Zap className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-80 p-0 rounded-xl border-border/30 shadow-xl">
                <div className="p-3 border-b border-border/20 space-y-2">
                  <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Respostas Rápidas</p>
                  <Input
                    value={quickSearch}
                    onChange={e => setQuickSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="h-8 text-xs bg-secondary/30 border-border/20"
                    autoFocus
                  />
                </div>
                <ScrollArea className="max-h-[240px]">
                  {(() => {
                    const s = quickSearch.toLowerCase();
                    const filtered = quickReplies.filter(qr =>
                      !s || qr.nome.toLowerCase().includes(s) || qr.conteudo.toLowerCase().includes(s) || qr.categoria.toLowerCase().includes(s)
                    );
                    if (filtered.length === 0) return <p className="text-xs text-muted-foreground p-4 text-center">Nenhuma resposta encontrada.</p>;
                    const categories = [...new Set(filtered.map(qr => qr.categoria))];
                    return categories.map(cat => (
                      <div key={cat}>
                        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 pt-2.5 pb-1">{cat}</p>
                        {filtered.filter(qr => qr.categoria === cat).map(qr => (
                          <button
                            key={qr.id}
                            className="w-full text-left px-3 py-2 hover:bg-secondary/40 transition-colors rounded-md mx-0"
                            onClick={() => { setText(prev => prev + qr.conteudo); setQuickOpen(false); setQuickSearch(""); }}
                          >
                            <p className="text-xs font-medium">{qr.nome}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{qr.conteudo}</p>
                          </button>
                        ))}
                      </div>
                    ));
                  })()}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Attachment */}
            <Button
              variant="ghost" size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-xl"
              title="Anexar arquivo"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
              onChange={handleFileSelect}
            />

            {/* Text input */}
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pendingFile ? "Legenda (opcional)..." : "Digite uma mensagem..."}
              className="min-h-[36px] max-h-[120px] resize-none text-sm bg-secondary/20 border-border/20 rounded-xl focus:bg-secondary/30 transition-colors"
              rows={1}
            />

            {/* Send */}
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl shadow-sm shadow-primary/20"
              disabled={(!text.trim() && !pendingFile) || sending}
              onClick={handleSend}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          {perfil?.assinatura_ativa && perfil.assinatura_padrao && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-muted-foreground/50">
                Assinando como: <span className="text-muted-foreground/70">{perfil.nome_completo}</span>
                {perfil.setor && <> · {perfil.setor}</>}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Close dialog */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)" }}>Encerrar ticket #{ticket.protocolo}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">Avaliação do atendimento (opcional):</p>
          <div className="flex gap-1.5 justify-center py-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className="p-1.5 transition-all hover:scale-110"
              >
                <Star className={`w-7 h-7 transition-colors ${n <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20 hover:text-muted-foreground/40"}`} />
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCloseDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleClose}>Encerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forward dialog */}
      <Dialog open={forwardDialog} onOpenChange={setForwardDialog}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)" }}>Encaminhar ticket #{ticket.protocolo}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-1">Selecione o atendente destino:</p>
          <Select value={forwardTarget} onValueChange={setForwardTarget}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Selecionar atendente..." />
            </SelectTrigger>
            <SelectContent>
              {atendentes.map(a => (
                <SelectItem key={a.user_id} value={a.user_id}>
                  <span className="flex items-center gap-2">
                    <span>{a.nome_completo}</span>
                    <Badge variant="outline" className="text-[9px] h-4">{a.cargo === "supervisor" ? "Supervisor" : a.cargo === "n2_tecnico" ? "N2" : "N1"}</Badge>
                  </span>
                </SelectItem>
              ))}
              {atendentes.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-3">Nenhum outro atendente disponível</div>
              )}
            </SelectContent>
          </Select>
          <Textarea
            value={forwardMotivo}
            onChange={e => setForwardMotivo(e.target.value)}
            placeholder="Motivo do encaminhamento (opcional)..."
            className="text-sm min-h-[60px] resize-none"
            maxLength={500}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setForwardDialog(false)}>Cancelar</Button>
            <Button onClick={handleForward} disabled={!forwardTarget || forwarding}>
              {forwarding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Forward className="w-4 h-4 mr-2" />}
              Encaminhar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxIndex !== null && allImageUrls[lightboxIndex] && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl flex items-center justify-center cursor-pointer" onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-4 right-4 text-foreground/60 hover:text-foreground z-10 p-2 rounded-xl hover:bg-secondary/40 transition-colors" onClick={() => setLightboxIndex(null)}>
            <X className="w-6 h-6" />
          </button>
          {allImageUrls.length > 1 && lightboxIndex > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground bg-secondary/40 hover:bg-secondary/60 rounded-xl p-2 z-10 transition-colors" onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {allImageUrls.length > 1 && lightboxIndex < allImageUrls.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground bg-secondary/40 hover:bg-secondary/60 rounded-xl p-2 z-10 transition-colors" onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          <img src={allImageUrls[lightboxIndex]} alt="Preview" className="max-w-[85vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
          {allImageUrls.length > 1 && (
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-foreground/50 text-xs bg-secondary/60 backdrop-blur-sm px-4 py-1.5 rounded-full font-medium">
              {lightboxIndex + 1} / {allImageUrls.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
