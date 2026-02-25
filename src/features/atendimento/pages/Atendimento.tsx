import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminLayout from "@/features/admin/components/AdminLayout";
import TicketList from "@/features/atendimento/components/TicketList";
import ChatArea from "@/features/atendimento/components/ChatArea";
import DetailPanel from "@/features/atendimento/components/DetailPanel";
import { useTickets, useMensagens, useMotivos, useAtendentePerfil, useForwardNotification, useNewTicketNotification, Ticket } from "@/features/atendimento/hooks/useAtendimento";
import { useOpenTicketCount } from "@/features/atendimento/hooks/useAtendimento";
import { supabase } from "@/integrations/supabase/client";

export default function Atendimento() {
  const [filter, setFilter] = useState("minha_fila");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  const { perfil, updatePerfil } = useAtendentePerfil();
  const { tickets, loading, loadingMore, hasMore, tabCounts, refetch, fetchMore, userId } = useTickets(filter, perfil?.cargo);
  const { mensagens, loading: loadingMensagens } = useMensagens(selectedTicket?.id || null);
  const { motivos } = useMotivos();
  const openCount = useOpenTicketCount();
  useForwardNotification(perfil?.id || null);
  useNewTicketNotification(userId, perfil?.cargo);

  // Track tickets forwarded to current user — highlight them temporarily
  useEffect(() => {
    if (!perfil?.id) return;
    const channel = supabase
      .channel(`forward-highlight-${perfil.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "tickets",
        filter: `atendente_id=eq.${perfil.id}`,
      }, (payload) => {
        const oldAtendente = (payload.old as any)?.atendente_id;
        const newAtendente = (payload.new as any)?.atendente_id;
        if (newAtendente === perfil.id && oldAtendente !== perfil.id) {
          const ticketId = (payload.new as any).id;
          setHighlightedIds(prev => new Set(prev).add(ticketId));
          setTimeout(() => {
            setHighlightedIds(prev => {
              const next = new Set(prev);
              next.delete(ticketId);
              return next;
            });
          }, 8000);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [perfil?.id]);

  // Update document title
  useEffect(() => {
    document.title = openCount > 0 ? `(${openCount}) Spectra` : "Spectra";
    return () => { document.title = "Spectra"; };
  }, [openCount]);

  // Keep selected ticket synced — deselect if transferred away from current user
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
      } else if (!loading) {
        // Ticket no longer in current queue (e.g. forwarded to another operator)
        setSelectedTicket(null);
      }
    }
  }, [tickets, loading]);

  const handleToggleDisponivel = async (val: boolean) => {
    await updatePerfil({ disponivel: val });
  };

  return (
    <AdminLayout>
      <div className="flex h-[calc(100dvh-theme(spacing.14))] md:h-[100dvh] -m-6 md:-m-10 overflow-hidden">
        {/* Mobile: show list OR chat, not both */}
        <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} md:w-[310px] shrink-0 flex-col`}>
          <TicketList
            tickets={tickets}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            tabCounts={tabCounts}
            onLoadMore={fetchMore}
            selectedId={selectedTicket?.id || null}
            onSelect={setSelectedTicket}
            filter={filter}
            onFilterChange={setFilter}
            perfil={perfil}
            onToggleDisponivel={handleToggleDisponivel}
            onNewTicket={(ticket) => { setSelectedTicket(ticket); refetch(); }}
            highlightedIds={highlightedIds}
          />
        </div>

        <div className={`${selectedTicket ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col`}>
          <ChatArea
            ticket={selectedTicket}
            mensagens={mensagens}
            loadingMensagens={loadingMensagens}
            motivos={motivos}
            perfil={perfil}
            showPanel={showPanel}
            onTogglePanel={() => setShowPanel(!showPanel)}
            onTicketUpdate={refetch}
            onBack={() => setSelectedTicket(null)}
          />
        </div>

        {showPanel && selectedTicket && (
          <div className="hidden lg:flex">
            <DetailPanel
              ticket={selectedTicket}
              motivos={motivos}
              onTicketUpdate={refetch}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
