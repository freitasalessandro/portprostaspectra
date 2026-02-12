import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, ExternalLink, Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import spectraLogo from "@/assets/spectra-logo.svg";

interface Proposal {
  id: string;
  client_name: string;
  project_title: string;
  total_value: number;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  accepted: "Aceita",
  rejected: "Rejeitada",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/20 text-primary",
  accepted: "bg-green-500/20 text-green-400",
  rejected: "bg-destructive/20 text-destructive",
};

const Admin = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      fetchProposals();
    };
    checkAuth();
  }, [navigate]);

  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar propostas", description: error.message, variant: "destructive" });
    } else {
      setProposals(data || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Proposta excluída" });
      fetchProposals();
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/proposta/${id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: url });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={spectraLogo} alt="Spectra" className="w-7 h-5" />
            <span className="font-display text-lg font-extrabold tracking-tight">
              SPECTR<span className="text-primary">A</span>
            </span>
            <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">/ Propostas</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl font-bold">Propostas</h1>
          <Button onClick={() => navigate("/admin/proposta/nova")} className="font-display uppercase tracking-widest text-xs">
            <Plus className="w-4 h-4 mr-2" /> Nova Proposta
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Carregando...</div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">Nenhuma proposta criada ainda.</p>
            <Button onClick={() => navigate("/admin/proposta/nova")} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Criar primeira proposta
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {proposals.map((p) => (
              <div key={p.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-display font-bold text-lg truncate">{p.project_title}</h3>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-bold ${statusColors[p.status]}`}>
                      {statusLabels[p.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.client_name}</p>
                  <p className="text-primary font-display font-bold mt-1">{formatCurrency(Number(p.total_value))}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => copyLink(p.id)} title="Copiar link">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => window.open(`/proposta/${p.id}`, "_blank")} title="Visualizar">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/proposta/${p.id}`)} title="Editar">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} title="Excluir" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
