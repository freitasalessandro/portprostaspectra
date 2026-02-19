import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Check, MessageCircle, ArrowRight, Sun, Moon, Download, FileText, DollarSign, Briefcase, ChevronRight, Menu, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import spectraLogo from "@/assets/spectra-logo.svg";
import { getSectionsForType, type ProposalType } from "@/lib/proposal-templates";
import { useIsMobile } from "@/hooks/use-mobile";

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
  case_link: string | null;
}

const ProposalView = () => {
  const { id } = useParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [socialProof, setSocialProof] = useState<SocialProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();

  // Accept form
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [acceptName, setAcceptName] = useState("");
  const [acceptEmail, setAcceptEmail] = useState("");
  const [accepting, setAccepting] = useState(false);

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveTab(sectionId);
    setShowMobileMenu(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Default to light theme on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("light");
    setIsDark(false);
    return () => {
      root.classList.remove("light");
    };
  }, []);

  const handleDownloadPdf = async () => {
    if (!contentRef.current || !proposal) return;
    setGeneratingPdf(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#000000",
        windowWidth: contentRef.current.scrollWidth,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const a4Width = 210;
      const a4Height = 297;
      const imgWidth = a4Width;
      const imgHeight = (canvas.height * a4Width) / canvas.width;

      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      let position = 0;
      let remaining = imgHeight;

      // First page
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

      // Add extra pages if content exceeds one A4
      while (remaining > a4Height) {
        position -= a4Height;
        remaining -= a4Height;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      }

      const slug = (proposal as any).slug || id || "proposta";
      pdf.save(`Proposta_${slug}_Spectra.pdf`);
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao gerar PDF", description: "Tente novamente", variant: "destructive" });
    } finally {
      setGeneratingPdf(false);
    }
  };

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

  const visibleSections = sections.filter(s => Object.values(s.content || {}).some(v => v && (v as string).trim()));
  const sectionNumberOffset = visibleSections.length;

  return (
    <div ref={contentRef} className="min-h-screen bg-background pb-20 md:pb-0 antialiased">
      {/* Sticky minimal navbar */}
      <nav className="sticky top-0 z-40 backdrop-blur-2xl bg-background/70 border-b border-border/10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={spectraLogo} alt="Spectra" className="w-6 h-4.5 opacity-80" />
            <span className="font-display text-sm font-extrabold tracking-tight text-foreground/80">SPECTRA</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {[
              { id: "overview", label: "Proposta" },
              { id: "investment", label: "Investimento" },
              ...(socialProof.length > 0 ? [{ id: "cases", label: "Cases" }] : []),
              { id: "next-steps", label: "Próximos Passos" },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => scrollToSection(nav.id)}
                className={`px-3 py-1.5 text-xs font-body font-medium rounded-full transition-all duration-300 ${
                  activeTab === nav.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {nav.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all duration-300 disabled:opacity-40"
              aria-label="Baixar PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all duration-300"
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero — Apple-style centered, massive type */}
      <header className="relative overflow-hidden">
        {/* Gradient orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 pt-16 md:pt-24 pb-12 md:pb-16 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="text-[10px] text-primary/80 tracking-[0.3em] uppercase font-body font-semibold px-3 py-1 border border-primary/20 rounded-full bg-primary/[0.04]">
                {proposal.type === "cto" ? "CTO as a Service" : "Design"}
              </span>
              {isAccepted && (
                <span className="text-[10px] tracking-[0.3em] uppercase font-body font-semibold px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Aceita
                </span>
              )}
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] mb-5 text-foreground">
              {proposal.project_title}
            </h1>

            <p className="text-muted-foreground font-body text-lg md:text-xl max-w-xl mx-auto">
              Proposta para <span className="text-foreground font-medium">{proposal.client_name}</span>
            </p>

            <div className="flex items-center justify-center gap-4 mt-5 text-xs text-muted-foreground/50 font-body">
              <span>{formatDate(proposal.created_at)}</span>
              {proposal.valid_until && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span>Válida até {formatDate(proposal.valid_until)}</span>
                </>
              )}
            </div>
          </motion.div>
        </div>
        {/* Subtle divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        {/* Description — clean editorial blockquote */}
        {proposal.description && (
          <motion.section
            id="overview"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16 md:mb-20"
          >
            <p className="font-body text-muted-foreground text-lg md:text-xl leading-relaxed">
              {proposal.description}
            </p>
          </motion.section>
        )}

        {/* Template Sections — clean, spacious, typographic */}
        <div className="space-y-14 md:space-y-20 mb-16 md:mb-20">
          {visibleSections.map((section, sIdx) => {
            const template = templateSections.find((t) => t.key === section.section_key);
            const sectionContent = section.content || {};

            return (
              <motion.section
                key={section.section_key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-6">
                  <span className="font-body text-[11px] text-primary/60 tracking-[0.25em] uppercase font-medium">
                    {String(sIdx + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-6">
                  {template?.items.map((item) => {
                    const text = sectionContent[item.key];
                    if (!text || !text.trim()) return null;
                    return (
                      <div key={item.key} className="group">
                        <h3 className="font-display text-xs font-bold text-foreground/50 uppercase tracking-[0.15em] mb-1.5">
                          {item.label}
                        </h3>
                        <p className="font-body text-foreground/80 text-[15px] leading-[1.7] whitespace-pre-wrap">
                          {text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Investment — Stripe-style pricing cards */}
        {items.length > 0 && (
          <motion.section
            id="investment"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16 md:mb-20"
          >
            <div className="mb-8">
              <span className="font-body text-[11px] text-primary/60 tracking-[0.25em] uppercase font-medium">
                {String(sectionNumberOffset + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
                Investimento
              </h2>
            </div>

            {(() => {
              const setupItems = items.filter(i => i.payment_type === "setup");
              const recurringItems = items.filter(i => i.payment_type === "recurring");
              return (
                <div className="space-y-6">
                  {setupItems.length > 0 && (
                    <div>
                      <h3 className="font-body text-xs font-bold text-foreground/50 uppercase tracking-[0.15em] mb-3">
                        Setup — Investimento Único
                      </h3>
                      <div className="rounded-xl border border-border/15 bg-card/30 overflow-hidden">
                        {setupItems.map((item, i) => {
                          const parsedInstallments = item.payment_terms
                            ? item.payment_terms.split("|").map(part => {
                                const match = part.trim().match(/^(.+?):\s*(\d+(?:\.\d+)?)%$/);
                                return match ? { label: match[1].trim(), percent: parseFloat(match[2]) } : null;
                              }).filter(Boolean) as { label: string; percent: number }[]
                            : [];
                          const setupValue = Number((proposal as any).setup_total) || 0;

                          return (
                            <div key={item.id} className={`px-5 py-4 ${i < setupItems.length - 1 ? "border-b border-border/10" : ""}`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-display font-bold text-[15px] text-foreground">{item.service_name}</h4>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground/60 mt-0.5 font-body">{item.description}</p>
                                  )}
                                </div>
                              </div>
                              {parsedInstallments.length > 0 && setupValue > 0 && (
                                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {parsedInstallments.map((inst, idx) => (
                                    <div key={idx} className="bg-background/50 border border-border/10 rounded-lg px-3 py-2.5 text-center">
                                      <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider block font-body mb-0.5">{inst.label}</span>
                                      <span className="font-display font-bold text-primary text-base">
                                        {formatCurrency(setupValue * inst.percent / 100)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {item.payment_terms && parsedInstallments.length === 0 && (
                                <p className="text-xs text-muted-foreground/50 mt-2 font-body">
                                  <span className="font-medium text-foreground/60">Condições:</span> {item.payment_terms}
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
                      <h3 className="font-body text-xs font-bold text-foreground/50 uppercase tracking-[0.15em] mb-3">
                        Recorrente — Investimento Mensal
                      </h3>
                      <div className="rounded-xl border border-border/15 bg-card/30 overflow-hidden">
                        {recurringItems.map((item, i) => (
                          <div key={item.id} className={`px-5 py-4 ${i < recurringItems.length - 1 ? "border-b border-border/10" : ""}`}>
                            <h4 className="font-display font-bold text-[15px] text-foreground">{item.service_name}</h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground/60 mt-0.5 font-body">{item.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total — hero pricing block */}
                  <div className="rounded-xl bg-gradient-to-b from-card/60 to-card/30 border border-border/15 p-6 md:p-8">
                    <div className="space-y-3">
                      {Number((proposal as any).setup_total) > 0 && (
                        <div className="flex justify-between items-baseline">
                          <span className="font-body text-sm text-muted-foreground/60">Setup (único)</span>
                          <span className="font-display text-lg font-bold text-foreground/80">
                            {formatCurrency(Number((proposal as any).setup_total))}
                          </span>
                        </div>
                      )}
                      {Number((proposal as any).recurring_total) > 0 && (
                        <div className="flex justify-between items-baseline">
                          <span className="font-body text-sm text-muted-foreground/60">Recorrente (mensal)</span>
                          <span className="font-display text-lg font-bold text-foreground/80">
                            {formatCurrency(Number((proposal as any).recurring_total))}
                          </span>
                        </div>
                      )}
                      <div className="h-px bg-border/10 my-2" />
                      <div className="flex justify-between items-baseline">
                        <span className="font-body text-sm text-foreground/70 font-medium">Investimento Total</span>
                        <span className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
                          {formatCurrency(Number(proposal.total_value))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.section>
        )}

        {/* Social Proof — minimal cards */}
        {socialProof.length > 0 && (
          <motion.section
            id="cases"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16 md:mb-20"
          >
            <div className="mb-8">
              <span className="font-body text-[11px] text-primary/60 tracking-[0.25em] uppercase font-medium">
                {String(sectionNumberOffset + 2).padStart(2, "0")}
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
                Cases Semelhantes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialProof.map((proof, i) => (
                <motion.a
                  key={i}
                  href={proof.case_link || undefined}
                  target={proof.case_link ? "_blank" : undefined}
                  rel={proof.case_link ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className={`rounded-xl border border-border/15 bg-card/20 p-5 group block transition-all duration-300 hover:border-border/30 hover:bg-card/40 ${proof.case_link ? "cursor-pointer" : ""}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] text-primary/60 tracking-[0.2em] uppercase font-body font-medium">
                      {proof.case_category}
                    </span>
                    {proof.case_metric && (
                      <div className="text-right">
                        <span className="font-display text-xl font-extrabold text-foreground leading-none">{proof.case_metric}</span>
                        {proof.case_metric_label && (
                          <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider block mt-0.5">{proof.case_metric_label}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-[15px] text-foreground group-hover:text-primary transition-colors duration-300 mb-1">
                    {proof.case_title}
                  </h3>
                  <p className="text-xs text-muted-foreground/50 font-body leading-relaxed">{proof.case_description}</p>
                  {proof.case_link && (
                    <span className="inline-flex items-center gap-1 mt-3 text-[10px] text-primary/60 font-body font-medium tracking-wider uppercase group-hover:text-primary group-hover:gap-2 transition-all duration-300">
                      Ver projeto <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </motion.a>
              ))}
            </div>
          </motion.section>
        )}

        {/* Next Steps / Acceptance — clean CTA */}
        <motion.section
          id="next-steps"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <div className="mb-8">
            <span className="font-body text-[11px] text-primary/60 tracking-[0.25em] uppercase font-medium">
              {String(sectionNumberOffset + (socialProof.length > 0 ? 3 : 2)).padStart(2, "0")}
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
              Próximos Passos
            </h2>
          </div>

          {isAccepted ? (
            <div className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="font-display text-xl font-bold text-green-500 mb-2">Proposta Aceita</h3>
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
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setShowAcceptForm(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2.5 h-12 px-6 font-display font-bold text-primary-foreground bg-primary rounded-xl text-sm tracking-wide relative overflow-hidden group transition-all duration-300 hover:shadow-[0_4px_24px_hsl(var(--primary)/0.3)]"
                  >
                    <Check className="w-4 h-4" />
                    Aprovar Proposta
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </motion.button>

                  {whatsappUrl && (
                    <motion.a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex-1 inline-flex items-center justify-center gap-2.5 h-12 px-6 font-display font-bold text-foreground border border-border/30 rounded-xl text-sm tracking-wide hover:border-border/50 hover:bg-muted/30 transition-all duration-300"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Falar no WhatsApp
                    </motion.a>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-border/20 bg-card/20 p-6 space-y-4">
                  <h3 className="font-display font-bold text-lg text-foreground">Confirmar Aceite</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground/70">Seu nome *</label>
                      <input
                        value={acceptName}
                        onChange={(e) => setAcceptName(e.target.value)}
                        placeholder="Nome completo"
                        className="w-full bg-background border border-border/20 rounded-lg px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground/70">Seu e-mail</label>
                      <input
                        value={acceptEmail}
                        onChange={(e) => setAcceptEmail(e.target.value)}
                        placeholder="email@empresa.com"
                        type="email"
                        className="w-full bg-background border border-border/20 rounded-lg px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleAccept}
                      disabled={accepting}
                      className="inline-flex items-center gap-2 h-10 px-5 font-display font-bold text-primary-foreground bg-primary rounded-lg text-xs tracking-wide transition-all duration-300 hover:shadow-[0_4px_24px_hsl(var(--primary)/0.3)] disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {accepting ? "Enviando..." : "Confirmar Aceite"}
                    </button>
                    <button
                      onClick={() => setShowAcceptForm(false)}
                      className="h-10 px-5 font-display font-bold text-muted-foreground text-xs tracking-wide hover:text-foreground transition-colors rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.section>

        {/* Footer — ultra minimal */}
        <footer className="pt-8 border-t border-border/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src={spectraLogo} alt="Spectra" className="w-5 h-4 opacity-60" />
              <div>
                <span className="font-display text-xs font-bold tracking-tight text-foreground/60 block">SPECTRA</span>
                <span className="text-[9px] text-muted-foreground/30 tracking-[0.15em] uppercase font-body">
                  Engenharia & Inteligência de Negócios
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://wa.me/5582933008540?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20os%20servi%C3%A7os%20da%20Spectra."
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground/40 hover:text-foreground/60 transition-colors font-body tracking-widest uppercase"
              >
                WhatsApp
              </a>
              <a
                href="mailto:contato@spectra.dev"
                className="text-[10px] text-muted-foreground/40 hover:text-foreground/60 transition-colors font-body tracking-widest uppercase"
              >
                E-mail
              </a>
              <span className="text-[9px] text-muted-foreground/20 font-body">
                © 2026
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <>
          <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-background/80 border-t border-border/10">
            <div className="flex items-center justify-around h-14 max-w-md mx-auto">
              {[
                { id: "overview", icon: FileText, label: "Proposta" },
                { id: "investment", icon: DollarSign, label: "Investimento" },
                ...(socialProof.length > 0 ? [{ id: "cases", icon: Briefcase, label: "Cases" }] : []),
                { id: "next-steps", icon: Check, label: "Aceitar" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 ${
                    activeTab === tab.id
                      ? "text-primary"
                      : "text-muted-foreground/50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-[8px] font-body font-medium tracking-wider uppercase">{tab.label}</span>
                </button>
              ))}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground/50 transition-all duration-200"
              >
                <Menu className="w-4 h-4" />
                <span className="text-[8px] font-body font-medium tracking-wider uppercase">Menu</span>
              </button>
            </div>
          </nav>

          {/* Mobile Drawer */}
          <AnimatePresence>
            {showMobileMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] bg-background/50 backdrop-blur-sm"
                  onClick={() => setShowMobileMenu(false)}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 z-[70] bg-card border-t border-border/15 rounded-t-2xl max-h-[60vh] overflow-y-auto"
                >
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-8 h-1 rounded-full bg-muted-foreground/20" />
                  </div>
                  <div className="p-5 space-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-sm font-bold text-foreground">Menu</h3>
                      <button onClick={() => setShowMobileMenu(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {[
                      { id: "overview", label: "Visão Geral", icon: FileText },
                      { id: "investment", label: "Investimento", icon: DollarSign },
                      ...(socialProof.length > 0 ? [{ id: "cases", label: "Cases Semelhantes", icon: Briefcase }] : []),
                      { id: "next-steps", label: "Próximos Passos", icon: ChevronRight },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                          activeTab === item.id
                            ? "bg-primary/8 text-primary"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="font-body text-sm">{item.label}</span>
                      </button>
                    ))}

                    <div className="border-t border-border/10 mt-3 pt-3 space-y-1">
                      <button
                        onClick={() => { handleDownloadPdf(); setShowMobileMenu(false); }}
                        disabled={generatingPdf}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all duration-200"
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        <span className="font-body text-sm">{generatingPdf ? "Gerando PDF..." : "Baixar PDF"}</span>
                      </button>
                      <button
                        onClick={() => { toggleTheme(); setShowMobileMenu(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all duration-200"
                      >
                        {isDark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                        <span className="font-body text-sm">{isDark ? "Modo Claro" : "Modo Escuro"}</span>
                      </button>
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all duration-200"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" />
                          <span className="font-body text-sm">Falar no WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default ProposalView;
