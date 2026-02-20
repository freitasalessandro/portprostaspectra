import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Copy, Pencil, Trash2, Shield, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { format } from "date-fns";

interface Contract {
  id: string;
  title: string;
  status: string;
  client_name: string | null;
  slug: string | null;
  access_code: string | null;
  created_at: string;
  updated_at: string;
}

interface ContractSignature {
  id: string;
  contract_id: string;
  signer_name: string;
  ip_address: string;
  user_agent: string;
  signature_hash: string;
  selfie_path: string;
  document_path: string;
  signed_at: string;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  signed: "Assinado",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/15 text-primary",
  signed: "bg-green-500/15 text-green-400",
};

const AdminContratos = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [signatures, setSignatures] = useState<Record<string, ContractSignature>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSig, setExpandedSig] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      fetchContracts();
    };
    checkAuth();
  }, [navigate]);

  const fetchContracts = async () => {
    const [contractsRes, sigsRes] = await Promise.all([
      supabase.from("contracts").select("*").order("created_at", { ascending: false }),
      supabase.from("contract_signatures").select("*").order("signed_at", { ascending: false }),
    ]);

    if (contractsRes.error) {
      toast({ title: "Erro ao carregar contratos", description: contractsRes.error.message, variant: "destructive" });
    } else {
      setContracts((contractsRes.data || []) as Contract[]);
    }

    if (!sigsRes.error && sigsRes.data) {
      const sigMap: Record<string, ContractSignature> = {};
      (sigsRes.data as unknown as ContractSignature[]).forEach(s => {
        if (!sigMap[s.contract_id]) sigMap[s.contract_id] = s;
      });
      setSignatures(sigMap);
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este contrato?")) return;
    const { error } = await supabase.from("contracts").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contrato excluído" });
      fetchContracts();
    }
  };

  const copyLink = (c: Contract) => {
    if (!c.slug) { toast({ title: "Contrato sem link público", variant: "destructive" }); return; }
    const url = `${window.location.origin}/contrato/${c.slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: url });
  };

  const getSignedUrl = (path: string) => {
    const { data } = supabase.storage.from("contract-signatures").getPublicUrl(path);
    return data?.publicUrl || "";
  };

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
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Contratos</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/contratos/configuracoes")}
              className="font-display uppercase tracking-[0.2em] text-[10px] py-5 px-5"
            >
              <Settings className="w-4 h-4 mr-2" /> Configurações
            </Button>
            <Button
              onClick={() => navigate("/admin/contratos/novo")}
              className="font-display uppercase tracking-[0.2em] text-[10px] py-5 px-6 relative overflow-hidden group glow-box"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Novo Contrato
              </span>
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center text-muted-foreground/40 py-20 font-body text-sm">Carregando...</div>
        ) : contracts.length === 0 ? (
          <motion.div className="text-center py-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-muted-foreground/40 mb-6 font-body text-sm">Nenhum contrato criado ainda.</p>
            <Button onClick={() => navigate("/admin/contratos/novo")} variant="outline" className="font-display uppercase tracking-widest text-xs">
              <Plus className="w-4 h-4 mr-2" /> Criar primeiro contrato
            </Button>
          </motion.div>
        ) : (
          <motion.div className="grid gap-3" variants={staggerContainer} initial="hidden" animate="visible">
            {contracts.map((c) => (
              <motion.div
                key={c.id}
                variants={fadeUp}
                className="glass-card-premium p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/30 to-transparent transition-all duration-500" />
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h3 className="font-display font-bold text-lg truncate group-hover:text-primary transition-colors duration-300">
                      {c.title}
                    </h3>
                    <span className={`text-[10px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-sm font-bold ${statusColors[c.status]}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                    {c.status === "signed" && signatures[c.id] && (
                      <button
                        onClick={() => setExpandedSig(expandedSig === c.id ? null : c.id)}
                        className="text-[10px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-sm font-bold bg-green-500/10 text-green-400 flex items-center gap-1 hover:bg-green-500/20 transition-colors"
                      >
                        <Shield className="w-3 h-3" /> Assinatura
                        {expandedSig === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground/60 font-body">{c.client_name || "—"}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground/40 font-body">
                      {format(new Date(c.created_at), "dd/MM/yyyy")}
                    </span>
                    {c.access_code && c.status !== "draft" && (
                      <span className="text-[10px] font-mono tracking-widest bg-muted/50 px-2 py-0.5 rounded text-muted-foreground">
                        🔒 {c.access_code}
                      </span>
                    )}
                  </div>

                  {/* Signature details */}
                  <AnimatePresence>
                    {expandedSig === c.id && signatures[c.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-3 rounded-lg border border-green-500/10 bg-green-500/[0.02] space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-body">
                            <div><span className="text-muted-foreground/50">Nome:</span> <span className="text-foreground">{signatures[c.id].signer_name}</span></div>
                            <div><span className="text-muted-foreground/50">IP:</span> <span className="text-foreground font-mono">{signatures[c.id].ip_address}</span></div>
                            <div><span className="text-muted-foreground/50">Data/Hora:</span> <span className="text-foreground">{new Date(signatures[c.id].signed_at).toLocaleString("pt-BR")}</span></div>
                            <div><span className="text-muted-foreground/50">User Agent:</span> <span className="text-foreground/60 text-[10px] break-all">{signatures[c.id].user_agent.substring(0, 80)}...</span></div>
                          </div>
                          {/* Selfie & Document photos */}
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <div>
                              <span className="text-[10px] text-muted-foreground/50 block mb-1">Selfie:</span>
                              <img src={getSignedUrl(signatures[c.id].selfie_path)} alt="Selfie" className="w-full max-w-[160px] rounded border border-border/30" />
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground/50 block mb-1">Documento:</span>
                              <img src={getSignedUrl(signatures[c.id].document_path)} alt="Documento" className="w-full max-w-[160px] rounded border border-border/30" />
                            </div>
                          </div>
                          <div className="pt-1.5 border-t border-green-500/10">
                            <span className="text-[10px] text-muted-foreground/50 block mb-0.5">Hash SHA-256:</span>
                            <code className="text-[10px] font-mono text-green-400/80 break-all select-all">{signatures[c.id].signature_hash}</code>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                  {c.slug && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => copyLink(c)} title="Copiar link" className="w-9 h-9 text-muted-foreground/40 hover:text-primary hover:bg-primary/10">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => window.open(`/contrato/${c.slug}`, "_blank")} title="Visualizar" className="w-9 h-9 text-muted-foreground/40 hover:text-primary hover:bg-primary/10">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/contratos/${c.id}`)} title="Editar" className="w-9 h-9 text-muted-foreground/40 hover:text-primary hover:bg-primary/10">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} title="Excluir" className="w-9 h-9 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10">
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

export default AdminContratos;
