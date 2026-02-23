import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, User, Plus, UserCheck, Loader2, Inbox, Filter } from "lucide-react";
import { Ticket, AtendentePerfil, cargoLabels, cargoColors, AtendenteCargo } from "@/hooks/useAtendimento";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contato {
  id: string;
  nome: string | null;
  whatsapp_number: string;
  empresa: string | null;
}

interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  tabCounts?: Record<string, number>;
  onLoadMore?: () => void;
  selectedId: string | null;
  onSelect: (ticket: Ticket) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  perfil: AtendentePerfil | null;
  onToggleDisponivel: (val: boolean) => void;
  onNewTicket: (ticket: Ticket) => void;
}

const statusColors: Record<string, string> = {
  ABERTO: "bg-accent/15 text-accent border-accent/25",
  EM_ATENDIMENTO: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  AGUARDANDO: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  ENCERRADO: "bg-muted text-muted-foreground border-border/50",
  CANCELADO: "bg-destructive/15 text-destructive border-destructive/25",
};

const statusLabels: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ATENDIMENTO: "Atendendo",
  AGUARDANDO: "Aguardando",
  ENCERRADO: "Encerrado",
  CANCELADO: "Cancelado",
};

const tabs = [
  { key: "minha_fila", label: "Minha Fila" },
  { key: "todos", label: "Todos" },
  { key: "aguardando", label: "Aguardando" },
  { key: "encerrados", label: "Encerrados" },
];

export default function TicketList({
  tickets, loading, loadingMore, hasMore, tabCounts, onLoadMore, selectedId, onSelect, filter, onFilterChange, perfil, onToggleDisponivel, onNewTicket,
}: TicketListProps) {
  const [search, setSearch] = useState("");
  const [atendenteFilter, setAtendenteFilter] = useState<string>("all");
  const [newDialog, setNewDialog] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newNome, setNewNome] = useState("");
  const [creating, setCreating] = useState(false);
  const [contatoSearch, setContatoSearch] = useState("");
  const [contatoResults, setContatoResults] = useState<Contato[]>([]);
  const [searchingContatos, setSearchingContatos] = useState(false);
  const [selectedContato, setSelectedContato] = useState<Contato | null>(null);
  const { toast } = useToast();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Extract unique atendentes from tickets for the filter dropdown
  const atendentes = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tickets) {
      if (t.atendente_id && t.atendente_nome) {
        map.set(t.atendente_id, t.atendente_nome);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [tickets]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || !onLoadMore || filter !== "encerrados") return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, filter, tickets.length]);

  // Debounced contact search
  useEffect(() => {
    if (!contatoSearch || contatoSearch.length < 2) { setContatoResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchingContatos(true);
      const term = contatoSearch.toLowerCase();
      const cleanDigits = contatoSearch.replace(/\D/g, "");
      const { data } = await supabase
        .from("contatos")
        .select("id, nome, whatsapp_number, empresa")
        .or(`nome.ilike.%${term}%,whatsapp_number.ilike.%${cleanDigits || term}%,empresa.ilike.%${term}%`)
        .limit(8);
      setContatoResults(data || []);
      setSearchingContatos(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [contatoSearch]);

  const formatWhatsApp = (digits: string) => {
    let formatted = digits;
    if (digits.length > 2) formatted = `+${digits.slice(0, 2)} (${digits.slice(2)}`;
    if (digits.length > 4) formatted = `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
    if (digits.length > 9) formatted = `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    return formatted;
  };

  const selectContato = (c: Contato) => {
    setSelectedContato(c);
    const digits = c.whatsapp_number.replace(/\D/g, "").slice(0, 13);
    setNewNumber(formatWhatsApp(digits));
    setNewNome(c.nome || "");
    setContatoSearch(""); setContatoResults([]);
  };

  const resetDialog = () => { setNewNumber(""); setNewNome(""); setContatoSearch(""); setContatoResults([]); setSelectedContato(null); };

  const handleCreateTicket = async () => {
    if (!newNumber.trim()) return;
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const cleanNum = newNumber.replace(/\D/g, "");
      if (cleanNum.length < 12 || cleanNum.length > 13) { toast({ title: "Número inválido", description: "Informe o número com DDI + DDD + número (ex: 5511999999999)", variant: "destructive" }); setCreating(false); return; }

      const { data: contato, error: cErr } = await supabase
        .from("contatos")
        .upsert({ whatsapp_number: cleanNum, nome: newNome || null, user_id: user.id }, { onConflict: "whatsapp_number" })
        .select()
        .single();
      if (cErr) throw cErr;

      const { data: ticket, error: tErr } = await supabase
        .from("tickets")
        .insert({ whatsapp_number: cleanNum, contato_id: contato.id, user_id: user.id, atendente_id: user.id, status: "EM_ATENDIMENTO", assumed_at: new Date().toISOString() })
        .select("*, contatos(*)")
        .single();
      if (tErr) throw tErr;

      onNewTicket({ ...ticket, contato: ticket.contatos, tags: ticket.tags || [] } as any);
      setNewDialog(false); resetDialog();
      toast({ title: "Conversa iniciada" });
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
    setCreating(false);
  };

  const filtered = tickets.filter(t => {
    // Atendente filter
    if (atendenteFilter === "unassigned" && t.atendente_id) return false;
    if (atendenteFilter !== "all" && atendenteFilter !== "unassigned" && t.atendente_id !== atendenteFilter) return false;
    // Text search
    if (!search) return true;
    const s = search.toLowerCase();
    return t.contato?.nome?.toLowerCase().includes(s) || t.whatsapp_number.includes(s) || t.protocolo?.toLowerCase().includes(s);
  });

  return (
    <div className="w-full shrink-0 border-r border-border/20 bg-card/20 backdrop-blur-sm flex flex-col h-full">
      {/* ─── HEADER ─── */}
      <div className="p-3 border-b border-border/15">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-display)" }}>
                {perfil?.nome_completo || "Atendente"}
              </p>
              {perfil?.cargo && (
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-[16px] font-semibold border ${cargoColors[perfil.cargo]}`}>
                  {cargoLabels[perfil.cargo]}
                </Badge>
              )}
            </div>
            {perfil?.setor && <p className="text-[10px] text-muted-foreground/60">{perfil.setor}</p>}
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${perfil?.disponivel ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-muted-foreground/30"}`} />
            <span className={`text-[10px] font-medium ${perfil?.disponivel ? "text-emerald-400/80" : "text-muted-foreground/50"}`}>
              {perfil?.disponivel ? "Online" : "Ausente"}
            </span>
            <Switch
              checked={perfil?.disponivel ?? false}
              onCheckedChange={onToggleDisponivel}
              className="scale-[0.7] ml-0.5"
            />
          </div>
        </div>

        {/* Search + New */}
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar ticket..."
              className="pl-8 h-8 text-xs bg-secondary/20 border-border/20 rounded-lg placeholder:text-muted-foreground/40"
            />
          </div>
          <Button size="icon" className="h-8 w-8 shrink-0 rounded-lg shadow-sm shadow-primary/20" onClick={() => setNewDialog(true)} title="Nova conversa">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Atendente filter */}
        {atendentes.length > 0 && (
          <div className="mt-1.5">
            <Select value={atendenteFilter} onValueChange={setAtendenteFilter}>
              <SelectTrigger className="h-7 text-[11px] bg-secondary/20 border-border/20 rounded-lg">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3 h-3 shrink-0 text-muted-foreground/60" />
                  <SelectValue placeholder="Filtrar por atendente" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="all" className="text-xs">Todos os atendentes</SelectItem>
                <SelectItem value="unassigned" className="text-xs">Sem atendente</SelectItem>
                {atendentes.map(([id, nome]) => (
                  <SelectItem key={id} value={id} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3 h-3 shrink-0 text-muted-foreground/60" />
                      {nome}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ─── TABS ─── */}
      <div className="flex border-b border-border/15 px-1 gap-0.5">
        {tabs.map(tab => {
          const isActive = filter === tab.key;
          const count = tabCounts?.[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors whitespace-nowrap px-1.5 relative ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              }`}
            >
              {tab.label}
              {count != null && count > 0 && (
                <span className={`ml-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/60 text-muted-foreground/60"
                }`}>
                  {count > 999 ? "999+" : count}
                </span>
              )}
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.15 }}
          className="flex-1 overflow-y-auto"
        >
        {loading ? (
          <div className="p-2 space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary/30 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground/50">Nenhum ticket encontrado</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((ticket, index) => {
              const isSelected = selectedId === ticket.id;
              const nome = ticket.contato?.nome || ticket.whatsapp_number;
              const initial = nome.charAt(0).toUpperCase();

              return (
                <motion.button
                  key={ticket.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                  layout
                  onClick={() => onSelect(ticket)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all group ${
                    isSelected
                      ? "bg-primary/8 border border-primary/15 shadow-sm"
                      : "hover:bg-secondary/30 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isSelected
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "bg-secondary/50 text-foreground/60 group-hover:bg-secondary/70"
                    }`}>
                      {initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[13px] font-semibold truncate ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                          {nome}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap font-medium">
                          {formatDistanceToNow(new Date(ticket.ultima_mensagem_at || ticket.created_at), { addSuffix: false, locale: ptBR })}
                        </span>
                      </div>

                      {ticket.ultima_mensagem ? (
                        <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5 leading-relaxed">{ticket.ultima_mensagem}</p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/40 truncate mt-0.5 font-mono">#{ticket.protocolo}</p>
                      )}

                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-[16px] font-semibold border ${statusColors[ticket.status] || ""}`}>
                          {statusLabels[ticket.status] || ticket.status}
                        </Badge>
                        {ticket.atendente_nome && (
                          <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5 truncate max-w-[90px]" title={ticket.atendente_nome}>
                            <UserCheck className="w-2.5 h-2.5 shrink-0" />
                            {ticket.atendente_nome.split(" ")[0]}
                          </span>
                        )}
                        {ticket.sla_status === "ALERTA" && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-[16px] font-semibold bg-amber-500/10 text-amber-400/80 border-amber-500/20 animate-pulse">
                            SLA
                          </Badge>
                        )}
                        {ticket.sla_status === "VIOLADO" && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-[16px] font-semibold bg-destructive/10 text-destructive/80 border-destructive/20 animate-pulse">
                            SLA
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}

        {/* Infinite scroll sentinel */}
        {filter === "encerrados" && hasMore && (
          <div ref={sentinelRef} className="p-4 flex justify-center">
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/40" />
            ) : (
              <span className="text-[10px] text-muted-foreground/40">Carregar mais...</span>
            )}
          </div>
        )}
        </motion.div>
      </AnimatePresence>

      {/* ─── NEW CONVERSATION DIALOG ─── */}
      <Dialog open={newDialog} onOpenChange={(open) => { setNewDialog(open); if (!open) resetDialog(); }}>
        <DialogContent className="max-w-md rounded-2xl border-border/30">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)" }}>Nova Conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Buscar contato existente</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <Input
                  value={contatoSearch}
                  onChange={e => { setContatoSearch(e.target.value); setSelectedContato(null); }}
                  placeholder="Nome, número ou empresa..."
                  className="pl-8 h-9 text-sm bg-secondary/20 border-border/20"
                />
              </div>
              {searchingContatos && <p className="text-[11px] text-muted-foreground/50">Buscando...</p>}
              {contatoResults.length > 0 && (
                <ScrollArea className="max-h-[140px] border border-border/20 rounded-xl">
                  {contatoResults.map(c => (
                    <button
                      key={c.id}
                      onClick={() => selectContato(c)}
                      className="w-full text-left px-3 py-2 hover:bg-secondary/30 transition-colors flex items-center gap-2 border-b border-border/10 last:border-0"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{c.nome || c.whatsapp_number}</p>
                        <p className="text-[10px] text-muted-foreground/50">{c.whatsapp_number}{c.empresa ? ` · ${c.empresa}` : ""}</p>
                      </div>
                    </button>
                  ))}
                </ScrollArea>
              )}
              {selectedContato && (
                <div className="flex items-center gap-2 px-2.5 py-2 bg-primary/8 rounded-xl border border-primary/15">
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium">{selectedContato.nome || selectedContato.whatsapp_number}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto text-muted-foreground hover:text-destructive" onClick={() => { setSelectedContato(null); setNewNumber(""); setNewNome(""); }}>
                    <span className="text-xs">✕</span>
                  </Button>
                </div>
              )}
            </div>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border/20" />
              <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">ou preencha manualmente</span>
              <div className="flex-1 h-px bg-border/20" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Número WhatsApp *</Label>
              <Input
                value={newNumber}
                onChange={e => {
                  setSelectedContato(null);
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
                  setNewNumber(formatWhatsApp(digits));
                }}
                placeholder="+55 (11) 99999-9999"
                className="h-9 text-sm bg-secondary/20 border-border/20"
              />
              {newNumber && newNumber.replace(/\D/g, "").length > 0 && newNumber.replace(/\D/g, "").length < 12 && (
                <p className="text-[11px] text-destructive/80">Número deve ter 12 ou 13 dígitos (ex: 5511999999999)</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Nome do contato (opcional)</Label>
              <Input value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="João Silva" className="h-9 text-sm bg-secondary/20 border-border/20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateTicket} disabled={creating || newNumber.replace(/\D/g, "").length < 12} className="shadow-sm shadow-primary/20">
              {creating ? "Criando..." : "Iniciar Conversa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
