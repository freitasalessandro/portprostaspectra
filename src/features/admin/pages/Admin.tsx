import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Copy, Pencil, Trash2, Shield, ChevronDown, ChevronUp, Undo2, Eye, X, FileSignature } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/features/admin/components/AdminLayout";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface Proposal {
  id: string;
  client_name: string;
  project_title: string;
  total_value: number;
  status: string;
  type: string;
  created_at: string;
  slug: string | null;
  access_code: string;
}

interface ProposalSignature {
  id: string;
  proposal_id: string;
  signer_name: string;
  ip_address: string;
  user_agent: string;
  signature_hash: string;
  signed_at: string;
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
  const [signatures, setSignatures] = useState<Record<string, ProposalSignature>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSig, setExpandedSig] = useState<string | null>(null);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [viewModalId, setViewModalId] = useState<string | null>(null);
  const [viewHistory, setViewHistory] = useState<{ id: string; viewed_at: string; ip_address: string }[]>([]);
  const [viewHistoryLoading, setViewHistoryLoading] = useState(false);
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
    const [proposalsRes, sigsRes] = await Promise.all([
      supabase.from("proposals").select("*").order("created_at", { ascending: false }),
      supabase.from("proposal_signatures").select("*").order("signed_at", { ascending: false }),
    ]);

    if (proposalsRes.error) {
      toast({ title: "Erro ao carregar propostas", description: proposalsRes.error.message, variant: "destructive" });
    } else {
      setProposals(proposalsRes.data || []);
      // Fetch view counts for all proposals
      const ids = (proposalsRes.data || []).map(p => p.id);
      if (ids.length > 0) {
        const { data: views } = await supabase
          .from("proposal_views")
          .select("proposal_id")
          .in("proposal_id", ids);
        if (views) {
          const counts: Record<string, number> = {};
          views.forEach((v: any) => { counts[v.proposal_id] = (counts[v.proposal_id] || 0) + 1; });
          setViewCounts(counts);
        }
      }
    }

    if (!sigsRes.error && sigsRes.data) {
      const sigMap: Record<string, ProposalSignature> = {};
      (sigsRes.data as unknown as ProposalSignature[]).forEach(s => {
        if (!sigMap[s.proposal_id]) sigMap[s.proposal_id] = s;
      });
      setSignatures(sigMap);
    }

    setLoading(false);
  };

  const openViewHistory = async (proposalId: string) => {
    setViewModalId(proposalId);
    setViewHistoryLoading(true);
    const { data } = await supabase
      .from("proposal_views")
      .select("id, viewed_at, ip_address")
      .eq("proposal_id", proposalId)
      .order("viewed_at", { ascending: false });
    setViewHistory((data as any) || []);
    setViewHistoryLoading(false);
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

  const handleRevoke = async (id: string) => {
    if (!confirm("Tem certeza que deseja revogar a aprovação desta proposta?")) return;
    const sig = signatures[id];
    const proposal = proposals.find(p => p.id === id);
    const { error: e1 } = await supabase.from("proposals").update({
      status: "sent",
      accepted_at: null,
      accepted_by_name: null,
      accepted_by_email: null,
    } as any).eq("id", id);
    const { error: e2 } = await supabase.from("proposal_signatures").delete().eq("proposal_id", id);
    if (e1 || e2) {
      toast({ title: "Erro ao revogar", description: (e1 || e2)?.message, variant: "destructive" });
    } else {
      // Audit log
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("audit_logs").insert({
          user_id: session.user.id,
          action: "proposal_approval_revoked",
          entity_type: "proposal",
          entity_id: id,
          metadata: {
            project_title: proposal?.project_title,
            client_name: proposal?.client_name,
            revoked_signature: sig ? {
              signer_name: sig.signer_name,
              signed_at: sig.signed_at,
              signature_hash: sig.signature_hash,
            } : null,
          },
        } as any);
      }
      toast({ title: "Aprovação revogada" });
      setExpandedSig(null);
      fetchProposals();
    }
  };

  const copyLink = (p: Proposal) => {
    const linkId = p.slug || p.id;
    const url = `${window.location.origin}/proposta/${linkId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: url });
  };

  const handleGenerateContract = async (p: Proposal) => {
    const { data: sigData } = await supabase
      .from("proposal_signatures")
      .select("*")
      .eq("proposal_id", p.id)
      .order("signed_at", { ascending: false })
      .limit(1);

    const sig = sigData?.[0] as any;
    const cd = sig?.contract_data || {};

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const fmtCur = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
    const fmtDt = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

    const vars: Record<string, string> = {
      nome: cd.nome_completo || cd.razao_social || p.client_name || "",
      cpf: cd.cpf || "",
      cnpj: cd.cnpj || "",
      razao_social: cd.razao_social || "",
      inscricao_estadual: cd.inscricao_estadual || "",
      representante_legal: cd.representante_legal || "",
      cpf_representante: cd.cpf_representante || "",
      nascimento: cd.nascimento ? fmtDt(cd.nascimento) : "",
      endereco: cd.endereco || "",
      cidade: cd.cidade || "",
      estado: cd.estado || "",
      cep: cd.cep || "",
      projeto: p.project_title || "",
      valor: fmtCur(Number(p.total_value)),
      data_aprovacao: fmtDt(sig?.signed_at || null),
      protocolo: sig?.signature_hash?.substring(0, 16)?.toUpperCase() || "",
    };

    const isPJ = cd.client_type === "pj";

    const templateHtml = isPJ ? [
      "<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>",
      `<p><strong>CONTRATANTE:</strong> ${vars.razao_social}, inscrita no CNPJ ${vars.cnpj}${vars.inscricao_estadual ? `, IE ${vars.inscricao_estadual}` : ""}, com sede em ${vars.endereco}, ${vars.cidade} - ${vars.estado}, CEP ${vars.cep}, neste ato representada por ${vars.representante_legal}, CPF ${vars.cpf_representante}.</p>`,
      `<p><strong>PROJETO:</strong> ${vars.projeto}</p>`,
      `<p><strong>VALOR:</strong> ${vars.valor}</p>`,
      `<p><strong>DATA DE APROVAÇÃO:</strong> ${vars.data_aprovacao}</p>`,
      `<p><strong>PROTOCOLO:</strong> ${vars.protocolo}</p>`,
      "<hr />",
      "<p>As partes acima qualificadas celebram o presente contrato de prestação de serviços, mediante as cláusulas e condições a seguir:</p>",
    ].join("\n") : [
      "<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>",
      `<p><strong>CONTRATANTE:</strong> ${vars.nome}, CPF ${vars.cpf}, nascido em ${vars.nascimento}, residente em ${vars.endereco}, ${vars.cidade} - ${vars.estado}, CEP ${vars.cep}.</p>`,
      `<p><strong>PROJETO:</strong> ${vars.projeto}</p>`,
      `<p><strong>VALOR:</strong> ${vars.valor}</p>`,
      `<p><strong>DATA DE APROVAÇÃO:</strong> ${vars.data_aprovacao}</p>`,
      `<p><strong>PROTOCOLO:</strong> ${vars.protocolo}</p>`,
      "<hr />",
      "<p>As partes acima qualificadas celebram o presente contrato de prestação de serviços, mediante as cláusulas e condições a seguir:</p>",
    ].join("\n");

    const { data: newContract, error } = await supabase.from("contracts").insert({
      user_id: session.user.id,
      title: `Contrato — ${p.project_title}`,
      client_name: cd.nome_completo || p.client_name,
      whatsapp_number: (p as any).whatsapp_number || null,
      proposal_id: p.id,
      content: {},
      status: "draft",
    } as any).select("id").single();

    if (error || !newContract) {
      toast({ title: "Erro ao gerar contrato", description: error?.message, variant: "destructive" });
      return;
    }

    localStorage.setItem(`contract_prefill_${newContract.id}`, templateHtml);
    navigate(`/admin/contratos/${newContract.id}`);
    toast({ title: "Contrato criado! Revise o conteúdo." });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
              <span className="w-6 h-px bg-primary/40" />
              Gestão
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Propostas</h1>
          </div>
          <Button
            onClick={() => navigate("/admin/proposta/nova")}
            className="font-display uppercase tracking-[0.2em] text-[10px] py-5 px-6 relative overflow-hidden group glow-box w-full sm:w-auto"
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
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h3 className="font-display font-bold text-lg truncate group-hover:text-primary transition-colors duration-300">
                      {p.project_title}
                    </h3>
                    <span className={`text-[10px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-sm font-bold ${statusColors[p.status]}`}>
                      {statusLabels[p.status]}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-sm font-bold bg-secondary/60 text-secondary-foreground/70">
                      {(p as any).type === "design" ? "Design" : "CTO"}
                    </span>
                    {viewCounts[p.id] > 0 && (
                      <button
                        onClick={() => openViewHistory(p.id)}
                        className="text-[10px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-sm font-bold bg-primary/10 text-primary flex items-center gap-1 hover:bg-primary/20 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> {viewCounts[p.id]}
                      </button>
                    )}
                    {p.status === "accepted" && signatures[p.id] && (
                      <button
                        onClick={() => setExpandedSig(expandedSig === p.id ? null : p.id)}
                        className="text-[10px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-sm font-bold bg-green-500/10 text-green-400 flex items-center gap-1 hover:bg-green-500/20 transition-colors"
                      >
                        <Shield className="w-3 h-3" /> Assinatura
                        {expandedSig === p.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground/60 font-body">{p.client_name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-primary font-display font-bold text-lg">{formatCurrency(Number(p.total_value))}</p>
                    {p.access_code && (
                      <span className="text-[10px] font-mono tracking-widest bg-muted/50 px-2 py-0.5 rounded text-muted-foreground" title="Código de acesso">
                        🔒 {p.access_code}
                      </span>
                    )}
                  </div>


                  {/* Signature details */}
                  <AnimatePresence>
                    {expandedSig === p.id && signatures[p.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-3 rounded-lg border border-green-500/10 bg-green-500/[0.02] space-y-1.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-body">
                            <div>
                              <span className="text-muted-foreground/50">Nome:</span>{" "}
                              <span className="text-foreground">{signatures[p.id].signer_name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground/50">IP:</span>{" "}
                              <span className="text-foreground font-mono">{signatures[p.id].ip_address}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground/50">Data/Hora:</span>{" "}
                              <span className="text-foreground">
                                {new Date(signatures[p.id].signed_at).toLocaleString("pt-BR")}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground/50">User Agent:</span>{" "}
                              <span className="text-foreground/60 text-[10px] break-all">{signatures[p.id].user_agent.substring(0, 80)}...</span>
                            </div>
                          </div>
                          <div className="pt-1.5 border-t border-green-500/10">
                            <span className="text-[10px] text-muted-foreground/50 block mb-0.5">Hash SHA-256:</span>
                            <code className="text-[10px] font-mono text-green-400/80 break-all select-all">{signatures[p.id].signature_hash}</code>
                          </div>
                          <div className="pt-2 border-t border-green-500/10 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(p.id)}
                              className="text-[10px] uppercase tracking-widest text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-3"
                            >
                              <Undo2 className="w-3 h-3 mr-1" /> Revogar aprovação
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                  {p.status === "accepted" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleGenerateContract(p)}
                      title="Gerar Contrato"
                      className="w-9 h-9 text-green-400/60 hover:text-green-400 hover:bg-green-500/10 transition-all duration-200"
                    >
                      <FileSignature className="w-4 h-4" />
                    </Button>
                  )}
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

      {/* View History Modal */}
      <Dialog open={!!viewModalId} onOpenChange={() => setViewModalId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Histórico de Visualizações</DialogTitle>
          </DialogHeader>
          {viewHistoryLoading ? (
            <p className="text-muted-foreground text-center py-6">Carregando...</p>
          ) : viewHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Nenhuma visualização registrada.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewHistory.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-sm">{format(new Date(v.viewed_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-sm">{format(new Date(v.viewed_at), "HH:mm:ss")}</TableCell>
                      <TableCell className="font-mono text-xs">{v.ip_address || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Admin;
