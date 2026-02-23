import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Save, Send, Copy, Check, ChevronDown, ChevronRight, Search, Eye, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import spectraLogo from "@/assets/spectra-logo.svg";
import { ProposalType, getSectionsForType } from "@/lib/proposal-templates";
import { Switch } from "@/components/ui/switch";

interface ProposalItem {
  id?: string;
  service_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  payment_type: "setup" | "recurring";
  payment_terms: string;
  ai_generated?: boolean;
}

interface SocialProofCase {
  case_title: string;
  case_category: string;
  case_description: string;
  case_metric: string;
  case_metric_label: string;
  case_link: string;
}

interface ServiceRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  is_case: boolean;
  metric: string | null;
  metric_label: string | null;
  link: string | null;
}

interface BdiSettings {
  bdi_tax: number;
  bdi_admin: number;
  bdi_risk: number;
  bdi_profit: number;
}

const generateSlug = (title: string) => {
  const base = title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
};

const calcBdiFactor = (bdi: BdiSettings) => {
  const denom = (1 - bdi.bdi_tax / 100) * (1 - bdi.bdi_admin / 100) * (1 - bdi.bdi_risk / 100) * (1 - bdi.bdi_profit / 100);
  if (denom <= 0) return null;
  return 1 / denom;
};

const ProposalEditor = () => {
  const { id } = useParams();
  const isNew = id === "nova";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [proposalType, setProposalType] = useState<ProposalType>("cto");
  const [clientType, setClientType] = useState<"pf" | "pj">("pf");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [status, setStatus] = useState("draft");
  const [slug, setSlug] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ProposalItem[]>([
    { service_name: "", description: "", quantity: 1, unit_price: 0, payment_type: "setup", payment_terms: "" },
  ]);

  // Sections content
  const [sectionsContent, setSectionsContent] = useState<Record<string, Record<string, string>>>({});

  // Social proof from DB cases
  const [dbCases, setDbCases] = useState<ServiceRecord[]>([]);
  const [selectedCases, setSelectedCases] = useState<SocialProofCase[]>([]);

  // Services for autocomplete
  const [allServices, setAllServices] = useState<ServiceRecord[]>([]);
  const [activeAutocomplete, setActiveAutocomplete] = useState<number | null>(null);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");

  // BDI
  const [bdi, setBdi] = useState<BdiSettings>({ bdi_tax: 0, bdi_admin: 0, bdi_risk: 0, bdi_profit: 0 });
  const [minBdi, setMinBdi] = useState<{ bdi_risk: number; bdi_profit: number }>({ bdi_risk: 0, bdi_profit: 0 });

  // Track if investment values (items or BDI) were modified — only save totals when true
  const [valuesChanged, setValuesChanged] = useState(false);

  // Payment plans
  const [paymentPlans, setPaymentPlans] = useState<{ id: string; name: string; description: string | null; installments: { label: string; percent: number }[] }[]>([]);

  // AI Briefing
  const [aiBriefing, setAiBriefing] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiRegeneratingSection, setAiRegeneratingSection] = useState<string | null>(null);

  // Modular sections
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [enabledBlocks, setEnabledBlocks] = useState<Record<string, boolean>>({
    client: true, project: true, items: true, socialProof: true,
  });
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});

  const sections = getSectionsForType(proposalType);

  // Initialize enabled sections when type changes
  useEffect(() => {
    const newSections = getSectionsForType(proposalType);
    setEnabledSections((prev) => {
      const updated = { ...prev };
      newSections.forEach((s) => {
        if (updated[s.key] === undefined) updated[s.key] = true;
      });
      return updated;
    });
  }, [proposalType]);

  // Load services, cases, and BDI on mount
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setCurrentUserId(session.user.id);

      const [servicesRes, settingsRes, plansRes] = await Promise.all([
        supabase.from("services").select("id,title,description,category,is_case,metric,metric_label").order("sort_order"),
        supabase.from("company_settings").select("bdi_tax,bdi_admin,bdi_risk,bdi_profit").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("payment_plans").select("id,name,description,installments").eq("active", true).order("sort_order"),
      ]);

      if (servicesRes.data) {
        setAllServices(servicesRes.data as ServiceRecord[]);
        setDbCases((servicesRes.data as ServiceRecord[]).filter(s => s.is_case));
      }
      if (settingsRes.data) {
        const globalRisk = Number(settingsRes.data.bdi_risk) || 0;
        const globalProfit = Number(settingsRes.data.bdi_profit) || 0;
        setMinBdi({ bdi_risk: globalRisk, bdi_profit: globalProfit });
        setBdi({
          bdi_tax: Number(settingsRes.data.bdi_tax) || 0,
          bdi_admin: Number(settingsRes.data.bdi_admin) || 0,
          bdi_risk: globalRisk,
          bdi_profit: globalProfit,
        });
      }
      if (plansRes.data) {
        setPaymentPlans(plansRes.data.map((p: any) => ({ id: p.id, name: p.name, description: p.description, installments: p.installments || [] })));
      }

      if (!isNew) loadProposal();
      else setLoading(false);
    };
    init();
  }, [id, navigate, isNew]);

  const loadProposal = async () => {
    const { data: proposal, error } = await supabase.from("proposals").select("*").eq("id", id).single();
    if (error || !proposal) { toast({ title: "Proposta não encontrada", variant: "destructive" }); navigate("/admin"); return; }

    setClientName(proposal.client_name);
    setClientEmail(proposal.client_email || "");
    setClientPhone(proposal.client_phone || "");
    setProjectTitle(proposal.project_title);
    setDescription(proposal.description || "");
    setValidUntil(proposal.valid_until || "");
    setNotes(proposal.notes || "");
    setStatus(proposal.status);
    setProposalType((proposal as any).type || "cto");
    setClientType((proposal as any).client_type || "pf");
    setWhatsappNumber((proposal as any).whatsapp_number || "");
    setSlug((proposal as any).slug || null);

    const [itemsRes, sectionsRes, proofRes] = await Promise.all([
      supabase.from("proposal_items").select("*").eq("proposal_id", id).order("created_at"),
      supabase.from("proposal_sections").select("*").eq("proposal_id", id).order("sort_order"),
      supabase.from("proposal_social_proof").select("*").eq("proposal_id", id).order("sort_order"),
    ]);

    if (itemsRes.data && itemsRes.data.length > 0) {
      setItems(itemsRes.data.map((i: any) => ({
        id: i.id, service_name: i.service_name, description: i.description || "",
        quantity: i.quantity, unit_price: Number(i.unit_price),
        payment_type: i.payment_type || "setup", payment_terms: i.payment_terms || "",
      })));
    }

    if (sectionsRes.data) {
      const content: Record<string, Record<string, string>> = {};
      sectionsRes.data.forEach((s: any) => { content[s.section_key] = s.content as Record<string, string>; });
      setSectionsContent(content);
    }

    if (proofRes.data) {
      setSelectedCases(proofRes.data.map((p: any) => ({
        case_title: p.case_title, case_category: p.case_category, case_description: p.case_description,
        case_metric: p.case_metric || "", case_metric_label: p.case_metric_label || "", case_link: p.case_link || "",
      })));
    }

    setLoading(false);
  };

  const setupDirect = items.filter(i => i.payment_type === "setup").reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const recurringDirect = items.filter(i => i.payment_type === "recurring").reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const directTotal = setupDirect + recurringDirect;
  const bdiFactor = calcBdiFactor(bdi);
  const setupTotal = bdiFactor ? setupDirect * bdiFactor : setupDirect;
  const recurringTotal = bdiFactor ? recurringDirect * bdiFactor : recurringDirect;
  const totalWithBdi = setupTotal + recurringTotal;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const addItem = () => { setItems([...items, { service_name: "", description: "", quantity: 1, unit_price: 0, payment_type: "setup", payment_terms: "" }]); setValuesChanged(true); };
  const removeItem = (index: number) => { if (items.length <= 1) return; setItems(items.filter((_, i) => i !== index)); setValuesChanged(true); };
  const updateItem = (index: number, field: keyof ProposalItem, value: string | number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
    setValuesChanged(true);
  };

  const selectServiceForItem = (index: number, svc: ServiceRecord) => {
    const updated = [...items];
    updated[index] = { ...updated[index], service_name: svc.title, description: svc.description };
    setItems(updated);
    setActiveAutocomplete(null);
    setAutocompleteQuery("");
  };

  const updateSectionContent = (sectionKey: string, itemKey: string, value: string) => {
    setSectionsContent((prev) => ({ ...prev, [sectionKey]: { ...(prev[sectionKey] || {}), [itemKey]: value } }));
  };

  const toggleCase = (svc: ServiceRecord) => {
    const exists = selectedCases.find((sc) => sc.case_title === svc.title);
    if (exists) {
      setSelectedCases(selectedCases.filter((sc) => sc.case_title !== svc.title));
    } else {
      setSelectedCases([...selectedCases, {
        case_title: svc.title,
        case_category: svc.category,
        case_description: svc.description,
        case_metric: svc.metric || "",
        case_metric_label: svc.metric_label || "",
        case_link: svc.link || "",
      }]);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiBriefing.trim()) {
      toast({ title: "Escreva um briefing antes de gerar", variant: "destructive" });
      return;
    }
    setAiGenerating(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-proposal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ briefing: aiBriefing.trim(), proposalType, userId: currentUserId }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        toast({ title: err.error || "Erro ao gerar proposta", variant: "destructive" });
        return;
      }

      const result = await resp.json();

      // Fill sections content
      if (result.sections) {
        setSectionsContent(result.sections);
      }
      // Fill suggested title/description if empty
      if (result.suggested_title && !projectTitle) {
        setProjectTitle(result.suggested_title);
      }
      if (result.suggested_description && !description) {
        setDescription(result.suggested_description);
      }
      // Fill suggested investment items
      if (result.suggested_items && Array.isArray(result.suggested_items) && result.suggested_items.length > 0) {
        const newItems = result.suggested_items.map((si: any) => ({
          service_name: si.service_name || "",
          description: si.description || "",
          quantity: si.quantity || 1,
          unit_price: si.estimated_price || 0,
          payment_type: si.payment_type === "recurring" ? "recurring" as const : "setup" as const,
          payment_terms: "",
          ai_generated: true,
        }));
        setItems(newItems);
        setValuesChanged(true);
      }

      toast({ title: "Proposta gerada com IA!", description: "Revise as seções e ajuste o conteúdo antes de salvar." });
    } catch (e) {
      console.error("AI generation error:", e);
      toast({ title: "Erro de conexão com IA", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAiRegenerateSection = async (sectionKey: string) => {
    if (!aiBriefing.trim()) {
      toast({ title: "Preencha o briefing na seção 'Gerar com IA' primeiro", variant: "destructive" });
      return;
    }
    const section = sections.find(s => s.key === sectionKey);
    if (!section) return;

    setAiRegeneratingSection(sectionKey);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-proposal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            briefing: aiBriefing.trim(),
            proposalType,
            sectionKey,
            sectionTitle: section.title,
            sectionItems: section.items.map(i => ({ key: i.key, label: i.label })),
            existingContent: sectionsContent[sectionKey] || null,
            userId: currentUserId,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        toast({ title: err.error || "Erro ao regenerar seção", variant: "destructive" });
        return;
      }

      const result = await resp.json();
      if (result[sectionKey]) {
        setSectionsContent(prev => ({ ...prev, [sectionKey]: result[sectionKey] }));
        toast({ title: `Seção "${section.title}" regenerada!` });
      }
    } catch (e) {
      console.error("AI section regen error:", e);
      toast({ title: "Erro de conexão com IA", variant: "destructive" });
    } finally {
      setAiRegeneratingSection(null);
    }
  };

  const fireCommunicationTriggers = async (event: string, proposalId: string, _userId: string) => {
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fire-trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ proposal_id: proposalId, event }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error("Trigger fire failed:", err);
      }
    } catch (e) {
      console.error("Error firing triggers:", e);
    }
  };

  const handleSave = async (newStatus?: string) => {
    if (!clientName.trim() || !projectTitle.trim()) {
      toast({ title: "Preencha nome do cliente e título do projeto", variant: "destructive" });
      return;
    }

    // Validate: at least one item with a name when sending
    const validItems = items.filter(i => i.service_name.trim());
    if (newStatus === "sent" && validItems.length === 0) {
      toast({ title: "Adicione pelo menos um item antes de enviar", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const proposalSlug = slug || generateSlug(projectTitle);

    // Prepare items, sections, and social proof BEFORE any deletes
    const itemsToInsert = items.filter((i) => i.service_name.trim()).map((i) => ({
      service_name: i.service_name.trim(),
      description: i.description.trim() || null, quantity: i.quantity, unit_price: i.unit_price,
      payment_type: i.payment_type, payment_terms: i.payment_terms.trim() || null,
    }));

    const sectionsToInsert = sections.map((s, i) => ({
      section_key: s.key, title: s.title,
      content: sectionsContent[s.key] || {}, sort_order: i,
    }));

    const proofToInsert = selectedCases.map((c, i) => ({
      case_title: c.case_title, case_category: c.case_category,
      case_description: c.case_description, case_metric: c.case_metric,
      case_metric_label: c.case_metric_label, case_link: c.case_link || null, sort_order: i,
    }));

    // Compute totals from the items we're about to save (not from potentially stale state)
    const savedSetupTotal = itemsToInsert.filter(i => i.payment_type === "setup").reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const savedRecurringTotal = itemsToInsert.filter(i => i.payment_type === "recurring").reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const savedSetupWithBdi = bdiFactor ? savedSetupTotal * bdiFactor : savedSetupTotal;
    const savedRecurringWithBdi = bdiFactor ? savedRecurringTotal * bdiFactor : savedRecurringTotal;
    const savedTotalWithBdi = savedSetupWithBdi + savedRecurringWithBdi;

    const proposalData = {
      user_id: session.user.id,
      client_name: clientName.trim(),
      client_email: clientEmail.trim() || null,
      client_phone: clientPhone.trim() || null,
      project_title: projectTitle.trim(),
      description: description.trim() || null,
      total_value: savedTotalWithBdi,
      setup_total: savedSetupWithBdi,
      recurring_total: savedRecurringWithBdi,
      status: newStatus || status,
      valid_until: validUntil || null,
      notes: notes.trim() || null,
      type: proposalType,
      client_type: clientType,
      whatsapp_number: whatsappNumber.trim() || null,
      slug: proposalSlug,
      bdi_factor: bdiFactor,
    };

    let proposalId = id;

    if (isNew) {
      const { data, error } = await supabase.from("proposals").insert(proposalData).select("id,slug").single();
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }
      proposalId = data.id;
      setSlug(data.slug);
    } else {
      const itemsWithId = itemsToInsert.map(i => ({ ...i, proposal_id: proposalId! }));
      const sectionsWithId = sectionsToInsert.map(s => ({ ...s, proposal_id: proposalId! }));
      const proofWithId = proofToInsert.map(p => ({ ...p, proposal_id: proposalId! }));

      // Only delete items if we have new items to insert (prevent accidental data loss)
      if (itemsWithId.length > 0) {
        const { error: delErr } = await supabase.from("proposal_items").delete().eq("proposal_id", id!);
        if (delErr) { toast({ title: "Erro ao atualizar itens", variant: "destructive" }); setSaving(false); return; }
        const { error: insErr } = await supabase.from("proposal_items").insert(itemsWithId);
        if (insErr) { toast({ title: "Erro ao salvar itens", description: insErr.message, variant: "destructive" }); setSaving(false); return; }
      }

      // Always update sections
      await supabase.from("proposal_sections").delete().eq("proposal_id", id!);
      if (sectionsWithId.length > 0) {
        await supabase.from("proposal_sections").insert(sectionsWithId);
      }

      // Only delete social proof if we have new ones
      if (proofWithId.length > 0) {
        await supabase.from("proposal_social_proof").delete().eq("proposal_id", id!);
        await supabase.from("proposal_social_proof").insert(proofWithId);
      } else {
        // User explicitly removed all cases
        const hasExistingProof = selectedCases.length === 0;
        if (hasExistingProof) {
          await supabase.from("proposal_social_proof").delete().eq("proposal_id", id!);
        }
      }

      // Only update monetary values if user changed items or BDI
      if (!valuesChanged) {
        delete (proposalData as any).total_value;
        delete (proposalData as any).setup_total;
        delete (proposalData as any).recurring_total;
        delete (proposalData as any).bdi_factor;
      }

      const { error } = await supabase.from("proposals").update(proposalData).eq("id", id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }
      setSlug(proposalSlug);
    }

    // For new proposals, insert related data after proposal is created
    if (isNew && proposalId) {
      const itemsWithId = itemsToInsert.map(i => ({ ...i, proposal_id: proposalId! }));
      const sectionsWithId = sectionsToInsert.map(s => ({ ...s, proposal_id: proposalId! }));
      const proofWithId = proofToInsert.map(p => ({ ...p, proposal_id: proposalId! }));

      if (itemsWithId.length > 0) await supabase.from("proposal_items").insert(itemsWithId);
      await supabase.from("proposal_sections").insert(sectionsWithId);
      if (proofWithId.length > 0) await supabase.from("proposal_social_proof").insert(proofWithId);
    }

    // Fire communication triggers AFTER all data is saved
    if (newStatus === "sent" && proposalId) {
      await fireCommunicationTriggers("proposta_enviada", proposalId, session.user.id);
    }

    setSaving(false);
    toast({ title: newStatus === "sent" ? "Proposta enviada!" : "Proposta salva!" });

    if (isNew) navigate(`/admin/proposta/${proposalId}`);
    else if (newStatus) setStatus(newStatus);
  };

  const copyLink = () => {
    if (isNew || !slug) { toast({ title: "Salve a proposta primeiro", variant: "destructive" }); return; }
    const url = `${window.location.origin}/proposta/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: url });
  };

  // Autocomplete filtered services
  const filteredServices = allServices.filter(s =>
    s.title.toLowerCase().includes(autocompleteQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(autocompleteQuery.toLowerCase())
  );


  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img src={spectraLogo} alt="Spectra" className="w-6 h-4" />
            <span className="font-display text-sm font-bold tracking-tight">
              {isNew ? "Nova Proposta" : "Editar Proposta"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && slug && (
              <>
                <Button variant="ghost" size="sm" onClick={() => window.open(`/proposta/${slug}`, "_blank")}>
                  <Eye className="w-4 h-4 mr-2" /> Visualizar
                </Button>
                <Button variant="ghost" size="sm" onClick={copyLink}>
                  <Copy className="w-4 h-4 mr-2" /> Link
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={saving}>
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
            <Button size="sm" onClick={() => handleSave("sent")} disabled={saving} className="font-display uppercase tracking-widest text-xs">
              <Send className="w-4 h-4 mr-2" /> Enviar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        {/* Proposal Type */}
        <ModuleBlock title="Tipo de Proposta" alwaysOn collapsed={!!collapsedBlocks["type"]}
          onToggleCollapse={() => setCollapsedBlocks((p) => ({ ...p, type: !p["type"] }))}>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setProposalType("cto")}
              className={`p-4 border rounded-sm text-left transition-all duration-300 ${proposalType === "cto" ? "border-primary bg-primary/10 text-primary" : "border-border/30 hover:border-border/60"}`}>
              <span className="font-display font-bold text-base block">CTO as a Service</span>
              <span className="text-xs text-muted-foreground">Engenharia, IA, arquitetura e automações</span>
            </button>
            <button onClick={() => setProposalType("design")}
              className={`p-4 border rounded-sm text-left transition-all duration-300 ${proposalType === "design" ? "border-primary bg-primary/10 text-primary" : "border-border/30 hover:border-border/60"}`}>
              <span className="font-display font-bold text-base block">Design</span>
              <span className="text-xs text-muted-foreground">Branding, tráfego, redes sociais e sites</span>
            </button>
          </div>
        </ModuleBlock>

        {/* AI Briefing */}
        <ModuleBlock title="Gerar com IA" alwaysOn collapsed={!!collapsedBlocks["ai"]}
          onToggleCollapse={() => setCollapsedBlocks((p) => ({ ...p, ai: !p["ai"] }))}>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground font-body">
              Descreva o cliente, contexto e necessidades. A IA preencherá automaticamente todas as seções da proposta.
            </p>
            <Textarea
              value={aiBriefing}
              onChange={(e) => setAiBriefing(e.target.value)}
              placeholder="Ex: Clínica de estética em SP, 3 unidades, precisa de site novo, gestão de redes sociais e tráfego pago. Atualmente não tem presença digital forte. Faturamento de R$ 500k/mês..."
              rows={5}
              disabled={aiGenerating}
            />
            <Button
              onClick={handleAiGenerate}
              disabled={aiGenerating || !aiBriefing.trim()}
              className="w-full font-display uppercase tracking-[0.2em] text-[10px] py-5 relative overflow-hidden group glow-box"
            >
              <span className="relative z-10 flex items-center gap-2">
                {aiGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Gerando proposta...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Gerar Proposta com IA</>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </Button>
          </div>
        </ModuleBlock>

        {/* Client Type PF/PJ */}
        <ModuleBlock title="Tipo de Cliente" alwaysOn collapsed={!!collapsedBlocks["clientType"]}
          onToggleCollapse={() => setCollapsedBlocks((p) => ({ ...p, clientType: !p["clientType"] }))}>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setClientType("pf")}
              className={`p-4 border rounded-sm text-left transition-all duration-300 ${clientType === "pf" ? "border-primary bg-primary/10 text-primary" : "border-border/30 hover:border-border/60"}`}>
              <span className="font-display font-bold text-base block">Pessoa Física</span>
              <span className="text-xs text-muted-foreground">CPF, RG, dados pessoais</span>
            </button>
            <button onClick={() => setClientType("pj")}
              className={`p-4 border rounded-sm text-left transition-all duration-300 ${clientType === "pj" ? "border-primary bg-primary/10 text-primary" : "border-border/30 hover:border-border/60"}`}>
              <span className="font-display font-bold text-base block">Pessoa Jurídica</span>
              <span className="text-xs text-muted-foreground">CNPJ, Razão Social, Representante Legal</span>
            </button>
          </div>
        </ModuleBlock>

        {/* Client Info */}
        <ModuleBlock title="Dados do Cliente" enabled={enabledBlocks.client}
          onToggleEnabled={() => setEnabledBlocks((p) => ({ ...p, client: !p.client }))}
          collapsed={!!collapsedBlocks["client"]}
          onToggleCollapse={() => setCollapsedBlocks((p) => ({ ...p, client: !p["client"] }))}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Nome do Cliente *</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Empresa LTDA" /></div>
            <div className="space-y-2"><Label>E-mail</Label>
              <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="contato@empresa.com" type="email" /></div>
            <div className="space-y-2"><Label>Telefone</Label>
              <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(11) 99999-9999" /></div>
          </div>
        </ModuleBlock>

        {/* Project Info */}
        <ModuleBlock title="Projeto" enabled={enabledBlocks.project}
          onToggleEnabled={() => setEnabledBlocks((p) => ({ ...p, project: !p.project }))}
          collapsed={!!collapsedBlocks["project"]}
          onToggleCollapse={() => setCollapsedBlocks((p) => ({ ...p, project: !p["project"] }))}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Título do Projeto *</Label>
                <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Redesign do Sistema" /></div>
              <div className="space-y-2"><Label>WhatsApp para contato</Label>
                <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="5511999999999" /></div>
            </div>
            <div className="space-y-2"><Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes sobre o projeto..." rows={3} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Válida até</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
              <div className="space-y-2"><Label>Observações internas</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas..." /></div>
            </div>
          </div>
        </ModuleBlock>

        {/* Template Sections */}
        {sections.map((section, idx) => (
          <ModuleBlock key={section.key} title={section.title} number={String(idx + 1).padStart(2, "0")}
            enabled={enabledSections[section.key] !== false}
            onToggleEnabled={() => setEnabledSections((p) => ({ ...p, [section.key]: !(p[section.key] !== false) }))}
            collapsed={!!collapsedSections[section.key]}
            onToggleCollapse={() => setCollapsedSections((p) => ({ ...p, [section.key]: !p[section.key] }))}
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAiRegenerateSection(section.key)}
                disabled={aiRegeneratingSection === section.key || !aiBriefing.trim()}
                className="text-xs gap-1.5"
                title={!aiBriefing.trim() ? "Preencha o briefing primeiro" : "Regenerar esta seção com IA"}
              >
                {aiRegeneratingSection === section.key ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span className="hidden md:inline">Regenerar</span>
              </Button>
            }>
            {section.items.map((item) => (
              <div key={item.key} className="space-y-2">
                <Label>{item.label}</Label>
                <Textarea value={sectionsContent[section.key]?.[item.key] || ""}
                  onChange={(e) => updateSectionContent(section.key, item.key, e.target.value)}
                  placeholder={item.placeholder} rows={3} />
              </div>
            ))}
          </ModuleBlock>
        ))}

        {/* Investment Items with Autocomplete */}
        <ModuleBlock title="Itens do Investimento" number={String(sections.length + 1).padStart(2, "0")}
          enabled={enabledBlocks.items}
          onToggleEnabled={() => setEnabledBlocks((p) => ({ ...p, items: !p.items }))}
          collapsed={!!collapsedBlocks["items"]}
          onToggleCollapse={() => setCollapsedBlocks((p) => ({ ...p, items: !p["items"] }))}
          action={<Button variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>}>
          <div className="space-y-4">
            {items.some(i => i.ai_generated) && (
              <div className="flex items-start gap-2.5 p-3 rounded-md border border-amber-500/30 bg-amber-500/5 text-amber-200/80">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <p className="text-xs leading-relaxed">
                  <span className="font-semibold text-amber-300">Valores estimados pela IA.</span>{" "}
                  Os preços sugeridos são aproximações de mercado. Revise e ajuste cada valor antes de enviar a proposta ao cliente.
                </p>
              </div>
            )}
            {items.map((item, index) => (
              <div key={index} className={`border rounded-sm p-4 space-y-3 ${item.ai_generated ? "border-amber-500/20 bg-amber-500/[0.02]" : "border-border/30"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2 relative">
                    <Label>Serviço</Label>
                    <div className="relative">
                      <Input
                        value={item.service_name}
                        onChange={(e) => {
                          updateItem(index, "service_name", e.target.value);
                          setActiveAutocomplete(index);
                          setAutocompleteQuery(e.target.value);
                        }}
                        onFocus={() => { setActiveAutocomplete(index); setAutocompleteQuery(item.service_name); }}
                        onBlur={() => setTimeout(() => setActiveAutocomplete(null), 200)}
                        placeholder="Digite para buscar serviço..."
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                    </div>
                    {activeAutocomplete === index && autocompleteQuery.length > 0 && filteredServices.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-sm shadow-lg max-h-48 overflow-y-auto">
                        {filteredServices.slice(0, 8).map(svc => (
                          <button key={svc.id}
                            onMouseDown={(e) => { e.preventDefault(); selectServiceForItem(index, svc); }}
                            className="w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors border-b border-border/10 last:border-0">
                            <span className="font-display font-bold text-sm block">{svc.title}</span>
                            <span className="text-[10px] text-primary/60 uppercase tracking-widest">{svc.category}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-destructive mt-6">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2"><Label>Descrição</Label>
                  <Input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} placeholder="Detalhes do serviço..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <div className="flex gap-2">
                      <button onClick={() => updateItem(index, "payment_type", "setup")}
                        className={`flex-1 px-3 py-2 text-xs font-display font-bold uppercase tracking-wider border rounded-sm transition-all ${item.payment_type === "setup" ? "border-primary bg-primary/10 text-primary" : "border-border/30 text-muted-foreground hover:border-border/60"}`}>
                        Setup
                      </button>
                      <button onClick={() => updateItem(index, "payment_type", "recurring")}
                        className={`flex-1 px-3 py-2 text-xs font-display font-bold uppercase tracking-wider border rounded-sm transition-all ${item.payment_type === "recurring" ? "border-primary bg-primary/10 text-primary" : "border-border/30 text-muted-foreground hover:border-border/60"}`}>
                        Recorrente
                      </button>
                    </div>
                  </div>
                  {item.payment_type === "setup" && (
                    <div className="space-y-2">
                      <Label>Condições de Pagamento</Label>
                      {paymentPlans.length > 0 ? (
                        <div className="space-y-2">
                          <select
                            value={item.payment_terms}
                            onChange={(e) => updateItem(index, "payment_terms", e.target.value)}
                            className="w-full bg-background border border-border/30 px-3 py-2 text-sm rounded-sm focus:border-primary/50 focus:outline-none transition-colors"
                          >
                            <option value="">Selecione um plano...</option>
                            {paymentPlans.map((plan) => (
                              <option key={plan.id} value={plan.installments.map(i => `${i.label}: ${i.percent}%`).join(" | ")}>
                                {plan.name} — {plan.installments.map(i => `${i.label}: ${i.percent}%`).join(", ")}
                              </option>
                            ))}
                            <option value="__custom">Personalizado...</option>
                          </select>
                          {item.payment_terms === "__custom" && (
                            <Input
                              value=""
                              onChange={(e) => updateItem(index, "payment_terms", e.target.value)}
                              placeholder="Ex: 50% entrada + 2x de 25%"
                            />
                          )}
                          {item.payment_terms && item.payment_terms !== "__custom" && (
                            <p className="text-[10px] text-muted-foreground/60">{item.payment_terms}</p>
                          )}
                        </div>
                      ) : (
                        <Input value={item.payment_terms} onChange={(e) => updateItem(index, "payment_terms", e.target.value)} placeholder="Ex: 3x sem juros, 50% entrada..." />
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Qtd</Label>
                    <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)} /></div>
                  <div className="space-y-2"><Label>Valor Unit.</Label>
                    <Input type="number" min={0} step={0.01} value={item.unit_price} onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)} /></div>
                  <div className="space-y-2"><Label>Subtotal</Label>
                    <div className="h-10 flex items-center text-primary font-display font-bold">{formatCurrency(item.quantity * item.unit_price)}</div></div>
                </div>
              </div>
            ))}
          </div>

          {/* BDI + Totals */}
          <div className="pt-4 border-t border-border/30 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Custo Direto</span>
              <span className="font-display font-bold">{formatCurrency(directTotal)}</span>
            </div>
          {/* Per-proposal BDI Risk & Profit overrides */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Riscos (%) <span className="text-[10px] text-muted-foreground/50">mín: {minBdi.bdi_risk}%</span></Label>
                <Input type="number" step="0.01" min={minBdi.bdi_risk} max={100} value={bdi.bdi_risk || ""} onChange={(e) => {
                  const num = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  if (!isNaN(num)) {
                    const clamped = Math.max(num, minBdi.bdi_risk);
                    setBdi(prev => ({ ...prev, bdi_risk: clamped }));
                    setValuesChanged(true);
                  }
                }} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Lucro (%) <span className="text-[10px] text-muted-foreground/50">mín: {minBdi.bdi_profit}%</span></Label>
                <Input type="number" step="0.01" min={minBdi.bdi_profit} max={100} value={bdi.bdi_profit || ""} onChange={(e) => {
                  const num = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  if (!isNaN(num)) {
                    const clamped = Math.max(num, minBdi.bdi_profit);
                    setBdi(prev => ({ ...prev, bdi_profit: clamped }));
                    setValuesChanged(true);
                  }
                }} placeholder="0" />
              </div>
            </div>
            {bdiFactor && bdiFactor > 1 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  BDI (×{bdiFactor.toFixed(4)})
                  <span className="text-[10px] text-muted-foreground/50 ml-1">
                    I:{bdi.bdi_tax}% A:{bdi.bdi_admin}% R:{bdi.bdi_risk}% L:{bdi.bdi_profit}%
                  </span>
                </span>
                <span className="font-display font-bold text-primary/70">+{formatCurrency(totalWithBdi - directTotal)}</span>
              </div>
            )}
            <div className="border-t border-border/20 pt-3 space-y-2">
              {setupTotal > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Setup (único)</span>
                  <span className="font-display font-bold text-foreground">{formatCurrency(setupTotal)}</span>
                </div>
              )}
              {recurringTotal > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Recorrente (mensal)</span>
                  <span className="font-display font-bold text-foreground">{formatCurrency(recurringTotal)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Final</span>
                <span className="text-2xl font-display font-extrabold text-primary">{formatCurrency(totalWithBdi)}</span>
              </div>
            </div>
          </div>
        </ModuleBlock>

        {/* Social Proof from DB Cases */}
        <ModuleBlock title="Prova Social — Selecione os Cases" number={String(sections.length + 2).padStart(2, "0")}
          enabled={enabledBlocks.socialProof}
          onToggleEnabled={() => setEnabledBlocks((p) => ({ ...p, socialProof: !p.socialProof }))}
          collapsed={!!collapsedBlocks["socialProof"]}
          onToggleCollapse={() => setCollapsedBlocks((p) => ({ ...p, socialProof: !p["socialProof"] }))}>
          {dbCases.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum case cadastrado. Marque serviços como "Case" no módulo de Serviços.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dbCases.map((c) => {
                const isSelected = selectedCases.some((sc) => sc.case_title === c.title);
                return (
                  <button key={c.id} onClick={() => toggleCase(c)}
                    className={`p-4 border rounded-sm text-left transition-all duration-300 relative ${isSelected ? "border-primary bg-primary/10" : "border-border/30 hover:border-border/60"}`}>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <span className="text-[9px] text-primary tracking-[0.25em] uppercase font-semibold block mb-1">{c.category}</span>
                    <span className="font-display font-bold text-sm block">{c.title}</span>
                    <span className="text-xs text-muted-foreground block mt-1">{c.description}</span>
                    {c.metric && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-display font-black text-primary text-sm">{c.metric}</span>
                        {c.metric_label && <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{c.metric_label}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Link fields for selected cases */}
          {selectedCases.length > 0 && (
            <div className="space-y-3 mt-4">
              <h3 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">Links dos Cases Selecionados</h3>
              {selectedCases.map((sc, idx) => (
                <div key={sc.case_title} className="flex items-center gap-3">
                  <span className="text-sm font-body text-foreground/80 min-w-[120px] truncate">{sc.case_title}</span>
                  <input
                    value={sc.case_link}
                    onChange={(e) => {
                      const updated = [...selectedCases];
                      updated[idx] = { ...updated[idx], case_link: e.target.value };
                      setSelectedCases(updated);
                    }}
                    placeholder="https://..."
                    className="flex-1 bg-background border border-border/30 rounded-sm px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
          )}
        </ModuleBlock>
      </main>
    </div>
  );
};

/* ─── Modular Block Component ─── */
interface ModuleBlockProps {
  title: string;
  number?: string;
  enabled?: boolean;
  alwaysOn?: boolean;
  onToggleEnabled?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const ModuleBlock = ({ title, number, enabled = true, alwaysOn, onToggleEnabled, collapsed, onToggleCollapse, action, children }: ModuleBlockProps) => {
  return (
    <div className={`glass-card overflow-hidden transition-all duration-300 ${!enabled ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none" onClick={onToggleCollapse}>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {number && <span className="text-primary text-xs tracking-[0.3em] uppercase font-semibold">{number}</span>}
        <h2 className="font-display font-bold text-lg flex-1">{title}</h2>
        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
        {!alwaysOn && onToggleEnabled && (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{enabled ? "Ativo" : "Oculto"}</span>
            <Switch checked={enabled} onCheckedChange={onToggleEnabled} />
          </div>
        )}
      </div>
      {!collapsed && enabled && (
        <div className="px-6 pb-6 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">{children}</div>
      )}
    </div>
  );
};

export default ProposalEditor;
