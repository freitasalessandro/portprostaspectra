import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";

interface Proposal {
  id: string;
  client_name: string;
  project_title: string;
  total_value: number;
  status: string;
  type: string;
  created_at: string;
  slug: string | null;
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

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Proposta excluída" });
      fetchProposals();
    }
  };

  const copyLink = (p: Proposal) => {
    const linkId = p.slug || p.id;
    const url = `${window.location.origin}/proposta/${linkId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: url });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <AdminLayout>
      <div className="max-w-5xl">
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
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-bold bg-secondary text-secondary-foreground">
                      {(p as any).type === "design" ? "Design" : "CTO"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.client_name}</p>
                  <p className="text-primary font-display font-bold mt-1">{formatCurrency(Number(p.total_value))}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => copyLink(p)} title="Copiar link">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => window.open(`/proposta/${p.slug || p.id}`, "_blank")} title="Visualizar">
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
      </div>
    </AdminLayout>
  );
};

export default Admin;
