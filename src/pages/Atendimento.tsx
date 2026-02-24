import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import TicketList from "@/components/atendimento/TicketList";
import ChatArea from "@/components/atendimento/ChatArea";
import DetailPanel from "@/components/atendimento/DetailPanel";
import { useTickets, useMensagens, useMotivos, useAtendentePerfil, useForwardNotification, useNewTicketNotification, Ticket } from "@/hooks/useAtendimento";
import { useOpenTicketCount } from "@/hooks/useAtendimento";

export default function Atendimento() {
  const [filter, setFilter] = useState("minha_fila");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showPanel, setShowPanel] = useState(true);

  const { perfil, updatePerfil } = useAtendentePerfil();
  const { tickets, loading, loadingMore, hasMore, tabCounts, refetch, fetchMore, userId } = useTickets(filter, perfil?.cargo);
  const { mensagens, loading: loadingMensagens } = useMensagens(selectedTicket?.id || null);
  const { motivos } = useMotivos();
  const openCount = useOpenTicketCount();
  useForwardNotification(perfil?.id || null);
  useNewTicketNotification(userId, perfil?.cargo);

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
