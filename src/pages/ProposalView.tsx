import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import spectraLogo from "@/assets/spectra-logo.svg";

interface Proposal {
  id: string;
  client_name: string;
  client_email: string | null;
  project_title: string;
  description: string | null;
  total_value: number;
  status: string;
  valid_until: string | null;
  created_at: string;
}

interface ProposalItem {
  id: string;
  service_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
}

const ProposalView = () => {
  const { id } = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProposal(data as Proposal);

      const { data: itemsData } = await supabase
        .from("proposal_items")
        .select("*")
        .eq("proposal_id", id)
        .order("created_at");

      setItems((itemsData || []) as ProposalItem[]);
      setLoading(false);
    };
    load();
  }, [id]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Carregando proposta...
      </div>
    );
  }

  if (notFound || !proposal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Proposta não encontrada</h1>
          <p className="text-muted-foreground">Este link pode estar inválido ou expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/60 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <img src={spectraLogo} alt="Spectra" className="w-8 h-6" />
            <span className="font-display text-xl font-extrabold tracking-tight">
              SPECTR<span className="text-primary">A</span>
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold mb-2">{proposal.project_title}</h1>
          <p className="text-muted-foreground">
            Proposta para <span className="text-foreground font-medium">{proposal.client_name}</span>
          </p>
          <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
            <span>Criada em {formatDate(proposal.created_at)}</span>
            {proposal.valid_until && <span>Válida até {formatDate(proposal.valid_until)}</span>}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Description */}
        {proposal.description && (
          <section className="glass-card p-6">
            <h2 className="font-display font-bold text-lg mb-3">Sobre o Projeto</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{proposal.description}</p>
          </section>
        )}

        {/* Services */}
        <section className="glass-card p-6">
          <h2 className="font-display font-bold text-lg mb-4">Serviços Inclusos</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between py-3 border-b border-border/20 last:border-0">
                <div className="flex-1">
                  <h3 className="font-display font-bold">{item.service_name}</h3>
                  {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                  {item.quantity > 1 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.quantity}x {formatCurrency(Number(item.unit_price))}
                    </p>
                  )}
                </div>
                <span className="font-display font-bold text-primary ml-4">
                  {formatCurrency(item.quantity * Number(item.unit_price))}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 mt-4 border-t border-border/30">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Investimento Total</p>
              <p className="text-3xl font-display font-extrabold text-primary">
                {formatCurrency(Number(proposal.total_value))}
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={spectraLogo} alt="Spectra" className="w-5 h-4" />
            <span className="font-display text-sm font-bold tracking-tight">
              SPECTR<span className="text-primary">A</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Proposta gerada pela Spectra</p>
        </footer>
      </main>
    </div>
  );
};

export default ProposalView;
