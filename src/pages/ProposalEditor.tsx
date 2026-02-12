import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Save, Send, Copy, Check, GripVertical, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import spectraLogo from "@/assets/spectra-logo.svg";
import { ProposalType, getSectionsForType, SPECTRA_CASES } from "@/lib/proposal-templates";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProposalItem {
  id?: string;
  service_name: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface SocialProofCase {
  case_title: string;
  case_category: string;
  case_description: string;
  case_metric: string;
  case_metric_label: string;
}

const ProposalEditor = () => {
  const { id } = useParams();
  const isNew = id === "nova";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [proposalType, setProposalType] = useState<ProposalType>("cto");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [status, setStatus] = useState("draft");
  const [items, setItems] = useState<ProposalItem[]>([
    { service_name: "", description: "", quantity: 1, unit_price: 0 },
  ]);

  // Sections content: { sectionKey: { itemKey: text } }
  const [sectionsContent, setSectionsContent] = useState<Record<string, Record<string, string>>>({});

  // Social proof
  const [selectedCases, setSelectedCases] = useState<SocialProofCase[]>([]);

  // Modular: which sections are enabled and which are collapsed
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  // Module toggles for fixed blocks
  const [enabledBlocks, setEnabledBlocks] = useState<Record<string, boolean>>({
    client: true,
    project: true,
    items: true,
    socialProof: true,
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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      if (!isNew) loadProposal();
    };
    checkAuth();
  }, [id, navigate, isNew]);

  const loadProposal = async () => {
    const { data: proposal, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !proposal) {
      toast({ title: "Proposta não encontrada", variant: "destructive" });
      navigate("/admin");
      return;
    }

    setClientName(proposal.client_name);
    setClientEmail(proposal.client_email || "");
    setClientPhone(proposal.client_phone || "");
    setProjectTitle(proposal.project_title);
    setDescription(proposal.description || "");
    setValidUntil(proposal.valid_until || "");
    setNotes(proposal.notes || "");
    setStatus(proposal.status);
    setProposalType((proposal as any).type || "cto");
    setWhatsappNumber((proposal as any).whatsapp_number || "");

    // Load items
    const { data: itemsData } = await supabase
      .from("proposal_items")
      .select("*")
      .eq("proposal_id", id)
      .order("created_at");

    if (itemsData && itemsData.length > 0) {
      setItems(itemsData.map((i) => ({
        id: i.id,
        service_name: i.service_name,
        description: i.description || "",
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
      })));
    }

    // Load sections
    const { data: sectionsData } = await supabase
      .from("proposal_sections")
      .select("*")
      .eq("proposal_id", id)
      .order("sort_order");

    if (sectionsData) {
      const content: Record<string, Record<string, string>> = {};
      sectionsData.forEach((s: any) => {
        content[s.section_key] = s.content as Record<string, string>;
      });
      setSectionsContent(content);
    }

    // Load social proof
    const { data: proofData } = await supabase
      .from("proposal_social_proof")
      .select("*")
      .eq("proposal_id", id)
      .order("sort_order");

    if (proofData) {
      setSelectedCases(proofData.map((p: any) => ({
        case_title: p.case_title,
        case_category: p.case_category,
        case_description: p.case_description,
        case_metric: p.case_metric || "",
        case_metric_label: p.case_metric_label || "",
      })));
    }

    setLoading(false);
  };

  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const addItem = () => setItems([...items, { service_name: "", description: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };
  const updateItem = (index: number, field: keyof ProposalItem, value: string | number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const updateSectionContent = (sectionKey: string, itemKey: string, value: string) => {
    setSectionsContent((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] || {}), [itemKey]: value },
    }));
  };

  const toggleCase = (c: typeof SPECTRA_CASES[0]) => {
    const exists = selectedCases.find((sc) => sc.case_title === c.title);
    if (exists) {
      setSelectedCases(selectedCases.filter((sc) => sc.case_title !== c.title));
    } else {
      setSelectedCases([...selectedCases, {
        case_title: c.title,
        case_category: c.category,
        case_description: c.description,
        case_metric: c.metric,
        case_metric_label: c.metricLabel,
      }]);
    }
  };

  const handleSave = async (newStatus?: string) => {
    if (!clientName.trim() || !projectTitle.trim()) {
      toast({ title: "Preencha nome do cliente e título do projeto", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const proposalData = {
      user_id: session.user.id,
      client_name: clientName.trim(),
      client_email: clientEmail.trim() || null,
      client_phone: clientPhone.trim() || null,
      project_title: projectTitle.trim(),
      description: description.trim() || null,
      total_value: totalValue,
      status: newStatus || status,
      valid_until: validUntil || null,
      notes: notes.trim() || null,
      type: proposalType,
      whatsapp_number: whatsappNumber.trim() || null,
    };

    let proposalId = id;

    if (isNew) {
      const { data, error } = await supabase.from("proposals").insert(proposalData).select("id").single();
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }
      proposalId = data.id;
    } else {
      const { error } = await supabase.from("proposals").update(proposalData).eq("id", id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }
      await supabase.from("proposal_items").delete().eq("proposal_id", id!);
      await supabase.from("proposal_sections").delete().eq("proposal_id", id!);
      await supabase.from("proposal_social_proof").delete().eq("proposal_id", id!);
    }

    // Insert items
    const itemsToInsert = items.filter((i) => i.service_name.trim()).map((i) => ({
      proposal_id: proposalId!,
      service_name: i.service_name.trim(),
      description: i.description.trim() || null,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));
    if (itemsToInsert.length > 0) {
      await supabase.from("proposal_items").insert(itemsToInsert);
    }

    // Insert sections
    const sectionsToInsert = sections.map((s, i) => ({
      proposal_id: proposalId!,
      section_key: s.key,
      title: s.title,
      content: sectionsContent[s.key] || {},
      sort_order: i,
    }));
    await supabase.from("proposal_sections").insert(sectionsToInsert);

    // Insert social proof
    if (selectedCases.length > 0) {
      const proofToInsert = selectedCases.map((c, i) => ({
        proposal_id: proposalId!,
        case_title: c.case_title,
        case_category: c.case_category,
        case_description: c.case_description,
        case_metric: c.case_metric,
        case_metric_label: c.case_metric_label,
        sort_order: i,
      }));
      await supabase.from("proposal_social_proof").insert(proofToInsert);
    }

    setSaving(false);
    toast({ title: newStatus === "sent" ? "Proposta enviada!" : "Proposta salva!" });

    if (isNew) {
      navigate(`/admin/proposta/${proposalId}`);
    } else {
      if (newStatus) setStatus(newStatus);
    }
  };

  const copyLink = () => {
    if (isNew) { toast({ title: "Salve a proposta primeiro", variant: "destructive" }); return; }
    const url = `${window.location.origin}/proposta/${id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: url });
  };

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
            {!isNew && (
              <Button variant="ghost" size="sm" onClick={copyLink}>
                <Copy className="w-4 h-4 mr-2" /> Link
              </Button>
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
        <ModuleBlock
          title="Tipo de Proposta"
          alwaysOn
          collapsed={!!collapsedBlocks["type"]}
          onToggleCollapse={() => setCollapsedBlocks((p) => ({ ...p, type: !p["type"] }))}
        >
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setProposalType("cto")}
              className={`p-4 border rounded-sm text-left transition-all duration-300 ${
                proposalType === "cto"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/30 hover:border-border/60"
              }`}
            >
              <span className="font-display font-bold text-base block">CTO as a Service</span>
              <span className="text-xs text-muted-foreground">Engenharia, IA, arquitetura e automações</span>
            </button>
            <button
              onClick={() => setProposalType("design")}
              className={`p-4 border rounded-sm text-left transition-all duration-300 ${
                proposalType === "design"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/30 hover:border-border/60"
              }`}
            >
              <span className="font-display font-bold text-base block">Design</span>
              <span className="text-xs text-muted-foreground">Branding, tráfego, redes sociais e sites</span>
            </button>
          </div>
        </ModuleBlock>

        {/* Client Info */}
        <ModuleBlock
          title="Dados do Cliente"
          enabled={enabledBlocks.client}
          onToggleEnabled={() => setEnabledBlocks((p) => ({ ...p, client: !p.client }))}
          collapsed={!!collapsedBlocks["client"]}
          onToggleCollapse={() => setCollapsedBlocks((p) => ({ ...p, client: !p["client"] }))}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nome do Cliente *</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Empresa LTDA" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="contato@empresa.com" type="email" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>
        </ModuleBlock>

        {/* Project Info */}
        <ModuleBlock
          title="Projeto"
          enabled={enabledBlocks.project}
          onToggleEnabled={() => setEnabledBlocks((p) => ({ ...p, project: !p.project }))}
          collapsed={!!collapsedBlocks["project"]}
          onToggleCollapse={() => setCollapsedBlocks((p) => ({ ...p, project: !p["project"] }))}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título do Projeto *</Label>
                <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Redesign do Sistema" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp para contato</Label>
                <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="5511999999999" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes sobre o projeto..." rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Válida até</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Observações internas</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas..." />
              </div>
            </div>
          </div>
        </ModuleBlock>

        {/* Template Sections — modular */}
        {sections.map((section, idx) => (
          <ModuleBlock
            key={section.key}
            title={section.title}
            number={String(idx + 1).padStart(2, "0")}
            enabled={enabledSections[section.key] !== false}
            onToggleEnabled={() => setEnabledSections((p) => ({ ...p, [section.key]: !(p[section.key] !== false) }))}
            collapsed={!!collapsedSections[section.key]}
            onToggleCollapse={() => setCollapsedSections((p) => ({ ...p, [section.key]: !p[section.key] }))}
          >
            {section.items.map((item) => (
              <div key={item.key} className="space-y-2">
                <Label>{item.label}</Label>
                <Textarea
                  value={sectionsContent[section.key]?.[item.key] || ""}
                  onChange={(e) => updateSectionContent(section.key, item.key, e.target.value)}
                  placeholder={item.placeholder}
                  rows={3}
                />
              </div>
            ))}
          </ModuleBlock>
        ))}

        {/* Services / Investment Items */}
        <ModuleBlock
          title="Itens do Investimento"
          number={String(sections.length + 1).padStart(2, "0")}
          enabled={enabledBlocks.items}
          onToggleEnabled={() => setEnabledBlocks((p) => ({ ...p, items: !p.items }))}
          collapsed={!!collapsedBlocks["items"]}
          onToggleCollapse={() => setCollapsedBlocks((p) => ({ ...p, items: !p["items"] }))}
          action={
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar
            </Button>
          }
        >
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-border/30 rounded-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Serviço</Label>
                    <Input
                      value={item.service_name}
                      onChange={(e) => updateItem(index, "service_name", e.target.value)}
                      placeholder="Ex: Arquitetura de Sistemas"
                    />
                  </div>
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-destructive mt-6">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="Detalhes do serviço..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Qtd</Label>
                    <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Unit.</Label>
                    <Input type="number" min={0} step={0.01} value={item.unit_price} onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtotal</Label>
                    <div className="h-10 flex items-center text-primary font-display font-bold">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-border/30">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-display font-extrabold text-primary">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </ModuleBlock>

        {/* Social Proof Selection */}
        <ModuleBlock
          title="Prova Social — Selecione os Cases"
          number={String(sections.length + 2).padStart(2, "0")}
          enabled={enabledBlocks.socialProof}
          onToggleEnabled={() => setEnabledBlocks((p) => ({ ...p, socialProof: !p.socialProof }))}
          collapsed={!!collapsedBlocks["socialProof"]}
          onToggleCollapse={() => setCollapsedBlocks((p) => ({ ...p, socialProof: !p["socialProof"] }))}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SPECTRA_CASES.map((c) => {
              const isSelected = selectedCases.some((sc) => sc.case_title === c.title);
              return (
                <button
                  key={c.title}
                  onClick={() => toggleCase(c)}
                  className={`p-4 border rounded-sm text-left transition-all duration-300 relative ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border/30 hover:border-border/60"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <span className="text-[9px] text-primary tracking-[0.25em] uppercase font-semibold block mb-1">{c.category}</span>
                  <span className="font-display font-bold text-sm block">{c.title}</span>
                  <span className="text-xs text-muted-foreground block mt-1">{c.description}</span>
                </button>
              );
            })}
          </div>
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
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none" onClick={onToggleCollapse}>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {number && (
          <span className="text-primary text-xs tracking-[0.3em] uppercase font-semibold">{number}</span>
        )}
        <h2 className="font-display font-bold text-lg flex-1">{title}</h2>
        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
        {!alwaysOn && onToggleEnabled && (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {enabled ? "Ativo" : "Oculto"}
            </span>
            <Switch checked={enabled} onCheckedChange={onToggleEnabled} />
          </div>
        )}
      </div>
      {/* Content */}
      {!collapsed && enabled && (
        <div className="px-6 pb-6 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default ProposalEditor;
