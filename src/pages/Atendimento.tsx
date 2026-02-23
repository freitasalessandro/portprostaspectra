import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import TicketList from "@/components/atendimento/TicketList";
import ChatArea from "@/components/atendimento/ChatArea";
import DetailPanel from "@/components/atendimento/DetailPanel";
import { useTickets, useMensagens, useMotivos, useAtendentePerfil, Ticket } from "@/hooks/useAtendimento";
import { useOpenTicketCount } from "@/hooks/useAtendimento";

export default function Atendimento() {
  const [filter, setFilter] = useState("minha_fila");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showPanel, setShowPanel] = useState(true);

  const { tickets, loading, loadingMore, hasMore, tabCounts, refetch, fetchMore, userId } = useTickets(filter);
  const { mensagens, loading: loadingMensagens } = useMensagens(selectedTicket?.id || null);
  const { motivos } = useMotivos();
  const { perfil, updatePerfil } = useAtendentePerfil();
  const openCount = useOpenTicketCount();

  // Update document title
  useEffect(() => {
    document.title = openCount > 0 ? `(${openCount}) Spectra` : "Spectra";
    return () => { document.title = "Spectra"; };
  }, [openCount]);

  // Keep selected ticket synced
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  }, [tickets]);

  const handleToggleDisponivel = async (val: boolean) => {
    await updatePerfil({ disponivel: val });
  };

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-theme(spacing.14))] md:h-[calc(100vh-theme(spacing.0))] -m-6 md:-m-10">
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

        <ChatArea
          ticket={selectedTicket}
          mensagens={mensagens}
          loadingMensagens={loadingMensagens}
          motivos={motivos}
          perfil={perfil}
          showPanel={showPanel}
          onTogglePanel={() => setShowPanel(!showPanel)}
          onTicketUpdate={refetch}
        />

        {showPanel && selectedTicket && (
          <DetailPanel
            ticket={selectedTicket}
            motivos={motivos}
            onTicketUpdate={refetch}
          />
        )}
      </div>
    </AdminLayout>
  );
}
