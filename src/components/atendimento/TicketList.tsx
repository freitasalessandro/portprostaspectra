import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Search, User, Plus } from "lucide-react";
import { Ticket, AtendentePerfil } from "@/hooks/useAtendimento";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (ticket: Ticket) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  perfil: AtendentePerfil | null;
  onToggleDisponivel: (val: boolean) => void;
  onNewTicket: (ticket: Ticket) => void;
}

const statusColors: Record<string, string> = {
  ABERTO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  EM_ATENDIMENTO: "bg-green-500/20 text-green-400 border-green-500/30",
  AGUARDANDO: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  ENCERRADO: "bg-muted text-muted-foreground border-border",
  CANCELADO: "bg-destructive/20 text-destructive border-destructive/30",
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
  tickets, loading, selectedId, onSelect, filter, onFilterChange, perfil, onToggleDisponivel, onNewTicket,
}: TicketListProps) {
  const [search, setSearch] = useState("");
  const [newDialog, setNewDialog] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newNome, setNewNome] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

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
      setNewDialog(false);
      setNewNumber("");
      setNewNome("");
      toast({ title: "Conversa iniciada" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const filtered = tickets.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.contato?.nome?.toLowerCase().includes(s) ||
      t.whatsapp_number.includes(s) ||
      t.protocolo?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="w-full md:w-[300px] shrink-0 border-r border-border/50 bg-card/30 flex flex-col h-full">
      {/* Header atendente */}
      <div className="p-3 border-b border-border/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{perfil?.nome_completo || "Atendente"}</p>
            <p className="text-[11px] text-muted-foreground">{perfil?.setor || ""}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-medium ${perfil?.disponivel ? "text-green-400" : "text-muted-foreground"}`}>
              {perfil?.disponivel ? "Online" : "Ausente"}
            </span>
            <Switch
              checked={perfil?.disponivel ?? false}
              onCheckedChange={onToggleDisponivel}
              className="scale-75"
            />
          </div>
        </div>

        {/* Search + New */}
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 h-8 text-xs bg-background/50"
            />
          </div>
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => setNewDialog(true)} title="Nova conversa">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/30 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={`flex-1 py-2 text-[11px] font-medium transition-colors whitespace-nowrap px-2 ${
              filter === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 border-b border-border/20">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Nenhum ticket encontrado
          </div>
        ) : (
          filtered.map(ticket => {
            const isSelected = selectedId === ticket.id;
            const nome = ticket.contato?.nome || ticket.whatsapp_number;
            const initial = nome.charAt(0).toUpperCase();

            return (
              <button
                key={ticket.id}
                onClick={() => onSelect(ticket)}
                className={`w-full text-left p-3 border-b border-border/20 transition-all hover:bg-accent/5 ${
                  isSelected ? "bg-primary/10 border-l-[3px] border-l-primary" : ""
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium truncate">{nome}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: false, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      #{ticket.protocolo}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${statusColors[ticket.status] || ""}`}>
                        {statusLabels[ticket.status] || ticket.status}
                      </Badge>
                      {ticket.sla_status === "ALERTA" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse">
                          SLA
                        </Badge>
                      )}
                      {ticket.sla_status === "VIOLADO" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-destructive/20 text-destructive border-destructive/30 animate-pulse">
                          SLA
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* New conversation dialog */}
      <Dialog open={newDialog} onOpenChange={setNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Número WhatsApp *</Label>
              <Input
                value={newNumber}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
                  let formatted = digits;
                  if (digits.length > 2) formatted = `+${digits.slice(0, 2)} (${digits.slice(2)}`;
                  if (digits.length > 4) formatted = `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
                  if (digits.length > 9) formatted = `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
                  setNewNumber(formatted);
                }}
                placeholder="+55 (11) 99999-9999"
                className="h-9 text-sm"
              />
              {newNumber && newNumber.replace(/\D/g, "").length > 0 && newNumber.replace(/\D/g, "").length < 12 && (
                <p className="text-[11px] text-destructive">Número deve ter 12 ou 13 dígitos (ex: 5511999999999)</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Nome do contato (opcional)</Label>
              <Input value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="João Silva" className="h-9 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateTicket} disabled={creating || newNumber.replace(/\D/g, "").length < 12}>
              {creating ? "Criando..." : "Iniciar Conversa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
