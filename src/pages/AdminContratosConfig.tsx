import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { motion } from "framer-motion";

interface ContractSettings {
  require_selfie: boolean;
  require_document: boolean;
  require_full_name: boolean;
  default_access_code_length: number;
  signature_terms_text: string;
  contract_footer_text: string;
  templates: ContractTemplate[];
}

interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  client_type: "pf" | "pj" | "both";
}

const defaultSettings: ContractSettings = {
  require_selfie: true,
  require_document: true,
  require_full_name: true,
  default_access_code_length: 6,
  signature_terms_text: "Declaro que li e concordo com todos os termos e condições deste contrato.",
  contract_footer_text: "",
  templates: [],
};

const AdminContratosConfig = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ContractSettings>(defaultSettings);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      // Load settings from company_settings metadata or localStorage
      const stored = localStorage.getItem("contract_settings");
      if (stored) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(stored) });
        } catch {}
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem("contract_settings", JSON.stringify(settings));
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Configurações salvas!" });
    }, 300);
  };

  const addTemplate = () => {
    setSettings(prev => ({
      ...prev,
      templates: [...prev.templates, {
        id: crypto.randomUUID(),
        name: "Novo Template",
        content: "<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>\n<p>Conteúdo do contrato...</p>",
        client_type: "both",
      }],
    }));
  };

  const updateTemplate = (id: string, field: keyof ContractTemplate, value: string) => {
    setSettings(prev => ({
      ...prev,
      templates: prev.templates.map(t => t.id === id ? { ...t, [field]: value } : t),
    }));
  };

  const removeTemplate = (id: string) => {
    setSettings(prev => ({
      ...prev,
      templates: prev.templates.filter(t => t.id !== id),
    }));
  };

  if (loading) return <AdminLayout><div className="text-center text-muted-foreground/40 py-20 font-body text-sm">Carregando...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/contratos")} className="text-muted-foreground/40 hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1 font-body flex items-center gap-2">
                <span className="w-6 h-px bg-primary/40" />
                Contratos
              </p>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">Configurações</h1>
            </div>
            <Button onClick={handleSave} disabled={saving} className="font-display uppercase tracking-[0.2em] text-[10px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </div>

          <div className="space-y-6">
            {/* Signature Rules */}
            <div className="glass-card-premium p-6 space-y-5">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-foreground/80">Regras de Assinatura</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-body text-sm">Exigir selfie</Label>
                    <p className="text-xs text-muted-foreground/60 font-body">O cliente precisa tirar uma foto do rosto ao assinar</p>
                  </div>
                  <Switch checked={settings.require_selfie} onCheckedChange={(v) => setSettings(p => ({ ...p, require_selfie: v }))} />
                </div>
                <div className="h-px bg-border/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-body text-sm">Exigir foto do documento</Label>
                    <p className="text-xs text-muted-foreground/60 font-body">O cliente precisa enviar foto de RG ou CNH</p>
                  </div>
                  <Switch checked={settings.require_document} onCheckedChange={(v) => setSettings(p => ({ ...p, require_document: v }))} />
                </div>
                <div className="h-px bg-border/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-body text-sm">Exigir nome completo</Label>
                    <p className="text-xs text-muted-foreground/60 font-body">Campo de nome completo obrigatório na assinatura</p>
                  </div>
                  <Switch checked={settings.require_full_name} onCheckedChange={(v) => setSettings(p => ({ ...p, require_full_name: v }))} />
                </div>
              </div>
            </div>

            {/* Terms and Footer */}
            <div className="glass-card-premium p-6 space-y-5">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-foreground/80">Textos Padrão</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-body text-sm">Texto dos termos de aceite</Label>
                  <Textarea
                    value={settings.signature_terms_text}
                    onChange={(e) => setSettings(p => ({ ...p, signature_terms_text: e.target.value }))}
                    rows={3}
                    placeholder="Texto exibido junto ao checkbox de aceite na assinatura..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">Rodapé do contrato</Label>
                  <Textarea
                    value={settings.contract_footer_text}
                    onChange={(e) => setSettings(p => ({ ...p, contract_footer_text: e.target.value }))}
                    rows={3}
                    placeholder="Texto que aparece no final de todo contrato gerado..."
                  />
                </div>
              </div>
            </div>

            {/* Contract Templates */}
            <div className="glass-card-premium p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-sm uppercase tracking-widest text-foreground/80">Templates de Contrato</h2>
                <Button variant="outline" size="sm" onClick={addTemplate} className="font-display uppercase tracking-widest text-[10px]">
                  <Plus className="w-3 h-3 mr-1" /> Novo Template
                </Button>
              </div>

              {settings.templates.length === 0 ? (
                <p className="text-sm text-muted-foreground/40 font-body text-center py-6">
                  Nenhum template criado. Crie templates para agilizar a geração de contratos.
                </p>
              ) : (
                <div className="space-y-4">
                  {settings.templates.map((tpl) => (
                    <div key={tpl.id} className="border border-border/20 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Input
                          value={tpl.name}
                          onChange={(e) => updateTemplate(tpl.id, "name", e.target.value)}
                          placeholder="Nome do template"
                          className="flex-1"
                        />
                        <select
                          value={tpl.client_type}
                          onChange={(e) => updateTemplate(tpl.id, "client_type", e.target.value)}
                          className="h-9 px-3 rounded-md border border-border/20 bg-background text-sm font-body"
                        >
                          <option value="both">PF & PJ</option>
                          <option value="pf">Pessoa Física</option>
                          <option value="pj">Pessoa Jurídica</option>
                        </select>
                        <Button variant="ghost" size="icon" onClick={() => removeTemplate(tpl.id)} className="text-muted-foreground/40 hover:text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={tpl.content}
                        onChange={(e) => updateTemplate(tpl.id, "content", e.target.value)}
                        rows={6}
                        placeholder="HTML do template. Use variáveis: {{nome}}, {{cpf}}, {{cnpj}}, {{razao_social}}, {{endereco}}, {{cidade}}, {{estado}}, {{cep}}, {{projeto}}, {{valor}}, {{data_aprovacao}}, {{protocolo}}, {{representante_legal}}, {{cpf_representante}}"
                        className="font-mono text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground/40 font-body">
                        Variáveis disponíveis: {"{{nome}}"}, {"{{cpf}}"}, {"{{cnpj}}"}, {"{{razao_social}}"}, {"{{endereco}}"}, {"{{cidade}}"}, {"{{estado}}"}, {"{{cep}}"}, {"{{projeto}}"}, {"{{valor}}"}, {"{{data_aprovacao}}"}, {"{{protocolo}}"}, {"{{representante_legal}}"}, {"{{cpf_representante}}"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminContratosConfig;
