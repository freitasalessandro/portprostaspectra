import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Check, MessageCircle, ArrowRight, Sun, Moon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import spectraLogo from "@/assets/spectra-logo.svg";
import { getSectionsForType, type ProposalType } from "@/lib/proposal-templates";

interface Proposal {
  id: string;
  type: string;
  client_name: string;
  client_email: string | null;
  project_title: string;
  description: string | null;
  total_value: number;
  status: string;
  valid_until: string | null;
  created_at: string;
  whatsapp_number: string | null;
  accepted_at: string | null;
  accepted_by_name: string | null;
}

interface ProposalItem {
  id: string;
  service_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  payment_type: string;
  payment_terms: string | null;
}

interface ProposalSection {
  section_key: string;
  title: string;
  content: Record<string, string>;
  sort_order: number;
}

interface SocialProof {
  case_title: string;
  case_category: string;
  case_description: string;
  case_metric: string | null;
  case_metric_label: string | null;
}

const ProposalView = () => {
  const { id } = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [socialProof, setSocialProof] = useState<SocialProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isDark, setIsDark] = useState(false);

  // Accept form
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [acceptName, setAcceptName] = useState("");
  const [acceptEmail, setAcceptEmail] = useState("");
  const [accepting, setAccepting] = useState(false);

  // Default to light theme on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("light");
    setIsDark(false);
    return () => {
      root.classList.remove("light");
    };
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    setIsDark(!isDark);
  };

  useEffect(() => {
    const load = async () => {
      // Try slug first, then UUID fallback
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");
      let query = supabase.from("proposals").select("*");
      if (isUuid) {
        query = query.eq("id", id);
      } else {
        query = query.eq("slug", id);
      }
      const { data, error } = await query.single();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setProposal(data as unknown as Proposal);
      const proposalId = data.id;

      const [itemsRes, sectionsRes, proofRes] = await Promise.all([
        supabase.from("proposal_items").select("*").eq("proposal_id", proposalId).order("created_at"),
        supabase.from("proposal_sections").select("*").eq("proposal_id", proposalId).order("sort_order"),
        supabase.from("proposal_social_proof").select("*").eq("proposal_id", proposalId).order("sort_order"),
      ]);

      setItems((itemsRes.data || []) as ProposalItem[]);
      setSections((sectionsRes.data || []) as unknown as ProposalSection[]);
      setSocialProof((proofRes.data || []) as unknown as SocialProof[]);
      setLoading(false);
    };
    load();
  }, [id]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const handleAccept = async () => {
    if (!acceptName.trim()) {
      toast({ title: "Informe seu nome", variant: "destructive" });
      return;
    }
    setAccepting(true);
    const { error } = await supabase.rpc("accept_proposal", {
      _proposal_id: id!,
      _accepted_by_name: acceptName.trim(),
      _accepted_by_email: acceptEmail.trim() || "",
    });
    if (error) {
      toast({ title: "Erro ao aceitar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Proposta aceita com sucesso!" });
      setProposal((prev) => prev ? { ...prev, status: "accepted", accepted_at: new Date().toISOString(), accepted_by_name: acceptName } : prev);
    }
    setAccepting(false);
  };

  const whatsappUrl = proposal?.whatsapp_number
    ? `https://wa.me/${proposal.whatsapp_number}?text=${encodeURIComponent(`Olá! Gostaria de falar sobre a proposta "${proposal.project_title}".`)}`
    : null;

  const templateSections = proposal ? getSectionsForType(proposal.type as ProposalType) : [];
  const isAccepted = proposal?.status === "accepted";

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-body">Carregando proposta...</div>;

  if (notFound || !proposal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Proposta não encontrada</h1>
          <p className="text-muted-foreground font-body">Este link pode estar inválido ou expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-border/20">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <motion.div
          className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-primary/5 blur-[150px] rounded-full pointer-events-none"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <img src={spectraLogo} alt="Spectra" className="w-8 h-6" style={{ filter: "drop-shadow(0 0 10px hsl(220 100% 55% / 0.3))" }} />
                <span className="font-display text-xl font-extrabold tracking-tight text-foreground">SPECTRA</span>
              </div>
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-300"
                aria-label="Alternar tema"
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </motion.button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] text-primary tracking-[0.3em] uppercase font-body font-semibold px-2 py-1 border border-primary/30 rounded-sm">
                {proposal.type === "cto" ? "CTO as a Service" : "Design"}
              </span>
              {isAccepted && (
                <span className="text-[10px] tracking-[0.3em] uppercase font-body font-semibold px-2 py-1 bg-green-500/20 text-green-400 rounded-sm flex items-center gap-1">
                  <Check className="w-3 h-3" /> Aceita
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-[1] mb-4">
              {proposal.project_title}
            </h1>

            <p className="text-muted-foreground font-body text-base">
              Proposta para <span className="text-foreground font-medium">{proposal.client_name}</span>
            </p>

            <div className="flex gap-6 mt-4 text-sm text-muted-foreground/60 font-body">
              <span>Criada em {formatDate(proposal.created_at)}</span>
              {proposal.valid_until && <span>Válida até {formatDate(proposal.valid_until)}</span>}
            </div>
          </motion.div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        {/* Description */}
        {proposal.description && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-body text-muted-foreground text-base leading-relaxed border-l-2 border-primary/30 pl-6"
          >
            {proposal.description}
          </motion.section>
        )}

        {/* Template Sections */}
        {sections.map((section, sIdx) => {
          const template = templateSections.find((t) => t.key === section.section_key);
          const sectionContent = section.content || {};
          const hasContent = Object.values(sectionContent).some((v) => v && v.trim());
          if (!hasContent) return null;

          return (
            <motion.section
              key={section.section_key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: sIdx * 0.05 }}
              className="space-y-6"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-display text-xs text-primary/50 tracking-[0.3em] uppercase">0{sIdx + 1}</span>
                <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">{section.title}</h2>
              </div>

              <div className="space-y-6 pl-8 border-l border-border/20">
                {template?.items.map((item) => {
                  const text = sectionContent[item.key];
                  if (!text || !text.trim()) return null;
                  return (
                    <div key={item.key}>
                      <h3 className="font-display text-sm font-bold text-primary/80 uppercase tracking-wider mb-2">{item.label}</h3>
                      <p className="font-body text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          );
        })}

        {/* Investment / Services */}
        {items.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-display text-xs text-primary/50 tracking-[0.3em] uppercase">
                0{sections.filter((s) => Object.values(s.content || {}).some((v) => v && (v as string).trim())).length + 1}
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">Investimento</h2>
            </div>

            {(() => {
              const setupItems = items.filter(i => i.payment_type === "setup");
              const recurringItems = items.filter(i => i.payment_type === "recurring");
              return (
                <div className="space-y-6">
                  {setupItems.length > 0 && (
                    <div>
                      <h3 className="font-display text-sm font-bold text-primary/80 uppercase tracking-wider mb-3">Setup — Investimento Único</h3>
                      <div className="border border-border/20 overflow-hidden">
                        {setupItems.map((item, i) => {
                          // Parse payment_terms like "Entrada: 50% | 2ª parcela: 25% | 3ª parcela: 25%"
                          const parsedInstallments = item.payment_terms
                            ? item.payment_terms.split("|").map(part => {
                                const match = part.trim().match(/^(.+?):\s*(\d+(?:\.\d+)?)%$/);
                                return match ? { label: match[1].trim(), percent: parseFloat(match[2]) } : null;
                              }).filter(Boolean) as { label: string; percent: number }[]
                            : [];
                          const setupValue = Number((proposal as any).setup_total) || 0;

                          return (
                            <div key={item.id} className={`p-5 ${i < setupItems.length - 1 ? "border-b border-border/15" : ""}`}>
                              <h4 className="font-display font-bold text-base">{item.service_name}</h4>
                              {item.description && <p className="text-sm text-muted-foreground/70 mt-1 font-body">{item.description}</p>}
                              {parsedInstallments.length > 0 && setupValue > 0 && (
                                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {parsedInstallments.map((inst, idx) => (
                                    <div key={idx} className="border border-border/15 bg-card/30 p-3 rounded-sm text-center">
                                      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block font-body">{inst.label}</span>
                                      <span className="font-display font-bold text-primary text-lg">
                                        {formatCurrency(setupValue * inst.percent / 100)}
                                      </span>
                                      <span className="text-[9px] text-muted-foreground/40 block">{inst.percent}%</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {item.payment_terms && parsedInstallments.length === 0 && (
                                <p className="text-xs text-primary/70 mt-2 font-body">
                                  <span className="font-semibold">Condições:</span> {item.payment_terms}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {recurringItems.length > 0 && (
                    <div>
                      <h3 className="font-display text-sm font-bold text-primary/80 uppercase tracking-wider mb-3">Recorrente — Investimento Mensal</h3>
                      <div className="border border-border/20 overflow-hidden">
                        {recurringItems.map((item, i) => (
                          <div key={item.id} className={`p-5 ${i < recurringItems.length - 1 ? "border-b border-border/15" : ""}`}>
                            <h4 className="font-display font-bold text-base">{item.service_name}</h4>
                            {item.description && <p className="text-sm text-muted-foreground/70 mt-1 font-body">{item.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-card/40 p-5 space-y-3 border border-border/20">
                    {Number((proposal as any).setup_total) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="font-body text-sm text-muted-foreground">Setup (único)</span>
                        <span className="font-display text-xl font-extrabold text-foreground">
                          {formatCurrency(Number((proposal as any).setup_total))}
                        </span>
                      </div>
                    )}
                    {Number((proposal as any).recurring_total) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="font-body text-sm text-muted-foreground">Recorrente (mensal)</span>
                        <span className="font-display text-xl font-extrabold text-foreground">
                          {formatCurrency(Number((proposal as any).recurring_total))}
                        </span>
                      </div>
                    )}
                    {(Number((proposal as any).setup_total) > 0 && Number((proposal as any).recurring_total) > 0) && (
                      <div className="flex justify-between items-center pt-3 border-t border-border/15">
                        <span className="font-body text-sm text-muted-foreground">Investimento Total</span>
                        <span className="font-display text-3xl font-extrabold text-gradient-intense">
                          {formatCurrency(Number(proposal.total_value))}
                        </span>
                      </div>
                    )}
                    {!(Number((proposal as any).setup_total) > 0 && Number((proposal as any).recurring_total) > 0) && (
                      <div className="flex justify-between items-center">
                        <span className="font-body text-sm text-muted-foreground">Investimento Total</span>
                        <span className="font-display text-3xl font-extrabold text-gradient-intense">
                          {formatCurrency(Number(proposal.total_value))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.section>
        )}

        {/* Social Proof */}
        {socialProof.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-display text-xs text-primary/50 tracking-[0.3em] uppercase">05</span>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">Cases Semelhantes</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialProof.map((proof, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="border border-border/20 p-5 hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[9px] text-primary/70 tracking-[0.25em] uppercase font-body font-semibold">
                      {proof.case_category}
                    </span>
                    {proof.case_metric && (
                      <div className="text-right">
                        <span className="font-display text-xl font-black text-gradient-intense leading-none">{proof.case_metric}</span>
                        {proof.case_metric_label && (
                          <span className="text-[8px] text-muted-foreground/50 uppercase tracking-wider block mt-0.5">{proof.case_metric_label}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-base group-hover:text-primary transition-colors duration-300">{proof.case_title}</h3>
                  <p className="text-xs text-muted-foreground/60 mt-2 font-body leading-relaxed">{proof.case_description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Next Steps / Acceptance */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xs text-primary/50 tracking-[0.3em] uppercase">06</span>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">Próximos Passos</h2>
          </div>

          {isAccepted ? (
            <div className="border border-green-500/30 bg-green-500/5 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-green-400 mb-2">Proposta Aceita</h3>
              <p className="text-muted-foreground font-body text-sm">
                Aceita por <span className="text-foreground font-medium">{proposal.accepted_by_name}</span>
                {proposal.accepted_at && <> em {formatDate(proposal.accepted_at)}</>}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {!showAcceptForm ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAcceptForm(true)}
                    className="flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 font-display font-bold text-primary-foreground bg-primary text-xs tracking-widest uppercase relative overflow-hidden group glow-box-intense"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Aprovar Proposta
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </motion.button>

                  {whatsappUrl && (
                    <motion.a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 font-display font-bold text-foreground border border-border/40 text-xs tracking-widest uppercase hover:border-green-500/50 hover:text-green-400 transition-all duration-300"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Falar no WhatsApp
                    </motion.a>
                  )}
                </div>
              ) : (
                <div className="border border-primary/30 p-6 space-y-4">
                  <h3 className="font-display font-bold text-lg">Confirmar Aceite</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-body text-muted-foreground">Seu nome *</label>
                      <input
                        value={acceptName}
                        onChange={(e) => setAcceptName(e.target.value)}
                        placeholder="Nome completo"
                        className="w-full bg-background border border-border/30 px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-body text-muted-foreground">Seu e-mail</label>
                      <input
                        value={acceptEmail}
                        onChange={(e) => setAcceptEmail(e.target.value)}
                        placeholder="email@empresa.com"
                        type="email"
                        className="w-full bg-background border border-border/30 px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAccept}
                      disabled={accepting}
                      className="inline-flex items-center gap-2 px-6 py-3 font-display font-bold text-primary-foreground bg-primary text-xs tracking-widest uppercase glow-box disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {accepting ? "Enviando..." : "Confirmar Aceite"}
                    </motion.button>
                    <button
                      onClick={() => setShowAcceptForm(false)}
                      className="px-6 py-3 font-display font-bold text-muted-foreground text-xs tracking-widest uppercase hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.section>

        {/* Footer */}
        <footer className="pt-8 border-t border-border/15 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={spectraLogo} alt="Spectra" className="w-5 h-4" style={{ filter: "drop-shadow(0 0 8px hsl(220 100% 55% / 0.2))" }} />
            <span className="font-display text-sm font-bold tracking-tight text-foreground">SPECTRA</span>
          </div>
          <p className="text-[10px] text-muted-foreground/40 tracking-[0.15em] uppercase font-body">
            Engenharia & Inteligência de Negócios
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ProposalView;
