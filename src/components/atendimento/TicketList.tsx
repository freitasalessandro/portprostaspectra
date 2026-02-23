import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, User } from "lucide-react";
import { Ticket, AtendentePerfil } from "@/hooks/useAtendimento";
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
  tickets, loading, selectedId, onSelect, filter, onFilterChange, perfil, onToggleDisponivel,
}: TicketListProps) {
  const [search, setSearch] = useState("");

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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-8 h-8 text-xs bg-background/50"
          />
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
    </div>
  );
}
