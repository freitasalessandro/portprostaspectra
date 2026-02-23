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
  Send, PauseCircle, XCircle, ChevronRight, ChevronLeft, Check, CheckCheck, Star, Zap, Loader2, Paperclip, Image, FileText, X, Download,
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
  if (status === "ENVIANDO") return <span className="text-muted-foreground text-[10px]">⏳</span>;
  if (status === "ENVIADO") return <Check className="w-3 h-3 text-muted-foreground" />;
  if (status === "ENTREGUE") return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
  if (status === "LIDO") return <CheckCheck className="w-3 h-3 text-blue-400" />;
  if (status === "ERRO") return <span className="text-destructive text-[10px]">✕</span>;
  return null;
}

function getFileType(file: File): PendingFile["tipo"] {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("video/")) return "VIDEO";
  if (file.type.startsWith("audio/")) return "AUDIO";
  return "DOCUMENT";
}

function MediaBubble({ msg, onImageClick }: { msg: Mensagem; onImageClick?: (url: string) => void }) {
  const isOut = msg.sentido === "SAIDA";

  if (msg.tipo === "IMAGE" && msg.midia_url) {
    return (
      <div className="space-y-1">
        <img
          src={msg.midia_url}
          alt="Imagem"
          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          style={{ maxHeight: 280 }}
          onClick={() => onImageClick?.(msg.midia_url!)}
        />
        {msg.conteudo && <p className="whitespace-pre-wrap break-words text-sm">{msg.conteudo}</p>}
      </div>
    );
  }

  if ((msg.tipo === "DOCUMENT" || msg.tipo === "AUDIO" || msg.tipo === "VIDEO") && msg.midia_url) {
    const fileName = msg.midia_url.split("/").pop() || "Arquivo";
    return (
      <div className="space-y-1">
        <a
          href={msg.midia_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${isOut ? "bg-primary-foreground/10" : "bg-background/30"}`}
        >
          {msg.tipo === "AUDIO" ? "🎵" : msg.tipo === "VIDEO" ? "🎬" : <FileText className="w-4 h-4 shrink-0" />}
          <span className="text-xs truncate flex-1">{decodeURIComponent(fileName)}</span>
          <Download className="w-3.5 h-3.5 shrink-0 opacity-60" />
        </a>
        {msg.conteudo && <p className="whitespace-pre-wrap break-words text-sm">{msg.conteudo}</p>}
      </div>
    );
  }

  return <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>;
}

export default function ChatArea({
  ticket, mensagens, loadingMensagens, motivos, perfil, showPanel, onTogglePanel, onTicketUpdate,
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
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

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items?.length) setDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${ticket!.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from("chat-media").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      console.error("Upload error:", error);
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return null;
    }

    const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSend = async () => {
    if ((!text.trim() && !pendingFile) || !ticket || !perfil) return;
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: "Erro", description: "Sessão expirada. Faça login novamente.", variant: "destructive" });
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

      const { data, error } = await supabase.functions.invoke("send-message", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          ticket_id: ticket.id,
          conteudo: text.trim() || null,
          atendente_id: perfil.id,
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
    <div
      className="flex-1 flex flex-col min-w-0 h-full relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Paperclip className="w-10 h-10 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-primary">Solte o arquivo aqui</p>
          </div>
        </div>
      )}
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
                      <MediaBubble msg={msg} onImageClick={setLightboxUrl} />
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
        {/* Sending indicator */}
        {sending && (
          <div className="flex justify-end mb-1.5">
            <div className="max-w-[70%] px-3 py-2 text-sm bg-primary/60 text-primary-foreground rounded-xl rounded-tr-none">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs opacity-80">Enviando...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      {ticket.status !== "ENCERRADO" && ticket.status !== "CANCELADO" && (
        <div className="p-3 border-t border-border/30 bg-card/20 shrink-0">
          {/* File preview */}
          {pendingFile && (
            <div className="mb-2 p-2 bg-secondary/40 rounded-lg flex items-center gap-2">
              {pendingFile.tipo === "IMAGE" && pendingFile.preview ? (
                <img src={pendingFile.preview} alt="Preview" className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center">
                  {pendingFile.tipo === "AUDIO" ? "🎵" : pendingFile.tipo === "VIDEO" ? "🎬" : <FileText className="w-5 h-5 text-muted-foreground" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{pendingFile.file.name}</p>
                <p className="text-[10px] text-muted-foreground">{(pendingFile.file.size / 1024).toFixed(0)} KB</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={clearPendingFile}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <Popover open={quickOpen} onOpenChange={setQuickOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-amber-400 hover:bg-amber-500/10" title="Respostas rápidas">
                  <Zap className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-80 p-0">
                <div className="p-2 border-b border-border/30 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Respostas Rápidas</p>
                  <Input
                    value={quickSearch}
                    onChange={e => setQuickSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="h-7 text-xs"
                    autoFocus
                  />
                </div>
                <ScrollArea className="max-h-[240px]">
                  {(() => {
                    const s = quickSearch.toLowerCase();
                    const filtered = quickReplies.filter(qr =>
                      !s || qr.nome.toLowerCase().includes(s) || qr.conteudo.toLowerCase().includes(s) || qr.categoria.toLowerCase().includes(s)
                    );
                    if (filtered.length === 0) return <p className="text-xs text-muted-foreground p-3 text-center">Nenhuma resposta encontrada.</p>;
                    const categories = [...new Set(filtered.map(qr => qr.categoria))];
                    return categories.map(cat => (
                      <div key={cat}>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2 pb-1">{cat}</p>
                        {filtered.filter(qr => qr.categoria === cat).map(qr => (
                          <button
                            key={qr.id}
                            className="w-full text-left px-3 py-1.5 hover:bg-secondary/60 transition-colors"
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

            {/* Attachment button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
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

            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pendingFile ? "Legenda (opcional)..." : "Digite uma mensagem..."}
              className="min-h-[36px] max-h-[120px] resize-none text-sm bg-background/50"
              rows={1}
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={(!text.trim() && !pendingFile) || sending}
              onClick={handleSend}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
