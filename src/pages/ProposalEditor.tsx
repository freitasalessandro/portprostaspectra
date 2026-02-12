import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Save, Send, Copy } from "lucide-react";
import spectraLogo from "@/assets/spectra-logo.svg";

interface ProposalItem {
  id?: string;
  service_name: string;
  description: string;
  quantity: number;
  unit_price: number;
}

const ProposalEditor = () => {
  const { id } = useParams();
  const isNew = id === "nova";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("draft");
  const [items, setItems] = useState<ProposalItem[]>([
    { service_name: "", description: "", quantity: 1, unit_price: 0 },
  ]);

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
    };

    let proposalId = id;

    if (isNew) {
      const { data, error } = await supabase.from("proposals").insert(proposalData).select("id").single();
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }
      proposalId = data.id;
    } else {
      const { error } = await supabase.from("proposals").update(proposalData).eq("id", id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }
      // Delete old items
      await supabase.from("proposal_items").delete().eq("proposal_id", id!);
    }

    // Insert items
    const itemsToInsert = items
      .filter((i) => i.service_name.trim())
      .map((i) => ({
        proposal_id: proposalId!,
        service_name: i.service_name.trim(),
        description: i.description.trim() || null,
        quantity: i.quantity,
        unit_price: i.unit_price,
      }));

    if (itemsToInsert.length > 0) {
      const { error } = await supabase.from("proposal_items").insert(itemsToInsert);
      if (error) { toast({ title: "Erro nos itens", description: error.message, variant: "destructive" }); }
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

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Client Info */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="font-display font-bold text-lg">Dados do Cliente</h2>
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
        </section>

        {/* Project Info */}
        <section className="glass-card p-6 space-y-4">
          <h2 className="font-display font-bold text-lg">Projeto</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título do Projeto *</Label>
              <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Redesign do Website" />
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
        </section>

        {/* Services / Items */}
        <section className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg">Serviços</h2>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-border/30 rounded-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Serviço</Label>
                    <Input
                      value={item.service_name}
                      onChange={(e) => updateItem(index, "service_name", e.target.value)}
                      placeholder="Ex: Design de Landing Page"
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
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Unit.</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                    />
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
        </section>
      </main>
    </div>
  );
};

export default ProposalEditor;
