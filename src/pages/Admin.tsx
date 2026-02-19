import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import { staggerContainer, fadeUp } from "@/lib/motion";

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
  sent: "bg-primary/15 text-primary",
  accepted: "bg-green-500/15 text-green-400",
  rejected: "bg-destructive/15 text-destructive",
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
        <motion.div
          className="flex items-center justify-between mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
              <span className="w-6 h-px bg-primary/40" />
              Gestão
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Propostas</h1>
          </div>
          <Button
            onClick={() => navigate("/admin/proposta/nova")}
            className="font-display uppercase tracking-[0.2em] text-[10px] py-5 px-6 relative overflow-hidden group glow-box"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nova Proposta
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </Button>
        </motion.div>

        {loading ? (
          <div className="text-center text-muted-foreground/40 py-20 font-body text-sm tracking-wide">Carregando...</div>
        ) : proposals.length === 0 ? (
          <motion.div
            className="text-center py-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-muted-foreground/40 mb-6 font-body text-sm">Nenhuma proposta criada ainda.</p>
            <Button onClick={() => navigate("/admin/proposta/nova")} variant="outline" className="font-display uppercase tracking-widest text-xs">
              <Plus className="w-4 h-4 mr-2" /> Criar primeira proposta
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {proposals.map((p) => (
              <motion.div
                key={p.id}
                variants={fadeUp}
                className="glass-card-premium p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
              >
                {/* Hover accent */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/30 to-transparent transition-all duration-500" />
                <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-primary/0 group-hover:bg-primary/5 blur-3xl transition-all duration-700 pointer-events-none" />

                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-display font-bold text-lg truncate group-hover:text-primary transition-colors duration-300">
                      {p.project_title}
                    </h3>
                    <span className={`text-[10px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-sm font-bold ${statusColors[p.status]}`}>
                      {statusLabels[p.status]}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-sm font-bold bg-secondary/60 text-secondary-foreground/70">
                      {(p as any).type === "design" ? "Design" : "CTO"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground/60 font-body">{p.client_name}</p>
                  <p className="text-primary font-display font-bold mt-1.5 text-lg">{formatCurrency(Number(p.total_value))}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                  {[
                    { icon: Copy, action: () => copyLink(p), label: "Copiar link" },
                    { icon: ExternalLink, action: () => window.open(`/proposta/${p.slug || p.id}`, "_blank"), label: "Visualizar" },
                    { icon: Pencil, action: () => navigate(`/admin/proposta/${p.id}`), label: "Editar" },
                  ].map(({ icon: Icon, action, label }) => (
                    <Button
                      key={label}
                      variant="ghost"
                      size="icon"
                      onClick={action}
                      title={label}
                      className="w-9 h-9 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all duration-200"
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(p.id)}
                    title="Excluir"
                    className="w-9 h-9 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Admin;
