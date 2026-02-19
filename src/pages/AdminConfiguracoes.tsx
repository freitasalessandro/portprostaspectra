import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Building2, Mail, Phone, Globe, MapPin, FileText, Calculator } from "lucide-react";

interface CompanySettings {
  id?: string;
  company_name: string;
  logo_url: string | null;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  cnpj: string;
  bdi_tax: number;
  bdi_admin: number;
  bdi_risk: number;
  bdi_profit: number;
}

const emptySettings: CompanySettings = {
  company_name: "",
  logo_url: null,
  email: "",
  phone: "",
  whatsapp: "",
  website: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  cnpj: "",
  bdi_tax: 0,
  bdi_admin: 0,
  bdi_risk: 0,
  bdi_profit: 0,
};

const calcBdiFactor = (s: CompanySettings) => {
  const tax = s.bdi_tax / 100;
  const admin = s.bdi_admin / 100;
  const risk = s.bdi_risk / 100;
  const profit = s.bdi_profit / 100;
  const denominator = 1 - (tax + admin + risk + profit);
  if (denominator <= 0) return null;
  return (1 / denominator);
};

const AdminConfiguracoes = () => {
  const [settings, setSettings] = useState<CompanySettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);

      const { data } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (data) {
        setSettings({
          id: data.id,
          company_name: data.company_name || "",
          logo_url: data.logo_url,
          email: data.email || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          website: data.website || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip_code: data.zip_code || "",
          cnpj: data.cnpj || "",
          bdi_tax: Number(data.bdi_tax) || 0,
          bdi_admin: Number(data.bdi_admin) || 0,
          bdi_risk: Number(data.bdi_risk) || 0,
          bdi_profit: Number(data.bdi_profit) || 0,
        });
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    const payload = {
      company_name: settings.company_name,
      logo_url: settings.logo_url,
      email: settings.email,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      website: settings.website,
      address: settings.address,
      city: settings.city,
      state: settings.state,
      zip_code: settings.zip_code,
      cnpj: settings.cnpj,
      bdi_tax: settings.bdi_tax,
      bdi_admin: settings.bdi_admin,
      bdi_risk: settings.bdi_risk,
      bdi_profit: settings.bdi_profit,
      user_id: userId,
    };

    let error;
    if (settings.id) {
      ({ error } = await supabase.from("company_settings").update(payload).eq("id", settings.id));
    } else {
      const res = await supabase.from("company_settings").insert(payload).select().single();
      error = res.error;
      if (res.data) setSettings(prev => ({ ...prev, id: res.data.id }));
    }

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas" });
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${userId}/logo-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("company-assets").upload(path, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
    setSettings(prev => ({ ...prev, logo_url: data.publicUrl }));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeLogo = () => {
    setSettings(prev => ({ ...prev, logo_url: null }));
  };

  const update = (field: keyof CompanySettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateNum = (field: keyof CompanySettings, value: string) => {
    const num = value === "" ? 0 : parseFloat(value);
    if (!isNaN(num)) setSettings(prev => ({ ...prev, [field]: num }));
  };

  const bdiFactor = calcBdiFactor(settings);
  const bdiPercent = bdiFactor ? ((bdiFactor - 1) * 100).toFixed(2) : null;

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center text-muted-foreground py-20">Carregando...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold mb-8">Configurações</h1>

        {/* Logo */}
        <section className="glass-card p-6 mb-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Identidade
          </h2>
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              {settings.logo_url ? (
                <div className="relative group w-24 h-24 rounded-lg border border-border/30 overflow-hidden bg-card/50">
                  <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                  <button
                    onClick={removeLogo}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className={`w-24 h-24 rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] uppercase tracking-widest">Logo</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Nome da empresa</label>
                <Input value={settings.company_name} onChange={e => update("company_name", e.target.value)} placeholder="Spectra" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">CNPJ</label>
                <Input value={settings.cnpj} onChange={e => update("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
            </div>
          </div>
        </section>

        {/* Contatos */}
        <section className="glass-card p-6 mb-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Contato
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">E-mail</label>
              <Input value={settings.email} onChange={e => update("email", e.target.value)} placeholder="contato@spectra.com" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Telefone</label>
              <Input value={settings.phone} onChange={e => update("phone", e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">WhatsApp</label>
              <Input value={settings.whatsapp} onChange={e => update("whatsapp", e.target.value)} placeholder="5511999999999" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Website</label>
              <Input value={settings.website} onChange={e => update("website", e.target.value)} placeholder="https://spectra.com" />
            </div>
          </div>
        </section>

        {/* Endereço */}
        <section className="glass-card p-6 mb-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Endereço
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Endereço</label>
              <Input value={settings.address} onChange={e => update("address", e.target.value)} placeholder="Rua Exemplo, 123 - Sala 1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Cidade</label>
                <Input value={settings.city} onChange={e => update("city", e.target.value)} placeholder="São Paulo" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Estado</label>
                <Input value={settings.state} onChange={e => update("state", e.target.value)} placeholder="SP" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">CEP</label>
                <Input value={settings.zip_code} onChange={e => update("zip_code", e.target.value)} placeholder="00000-000" />
              </div>
            </div>
          </div>
        </section>

        {/* BDI */}
        <section className="glass-card p-6 mb-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Calculator className="w-4 h-4" /> BDI Global
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Imposto (%)</label>
              <Input type="number" step="0.01" min="0" max="100" value={settings.bdi_tax || ""} onChange={e => updateNum("bdi_tax", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Desp. Admin (%)</label>
              <Input type="number" step="0.01" min="0" max="100" value={settings.bdi_admin || ""} onChange={e => updateNum("bdi_admin", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Riscos (%)</label>
              <Input type="number" step="0.01" min="0" max="100" value={settings.bdi_risk || ""} onChange={e => updateNum("bdi_risk", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Lucro (%)</label>
              <Input type="number" step="0.01" min="0" max="100" value={settings.bdi_profit || ""} onChange={e => updateNum("bdi_profit", e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="rounded-md border border-border/50 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Fator BDI</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Fórmula: 1 / (1 − Σ percentuais)</p>
            </div>
            {bdiFactor ? (
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-primary">{bdiFactor.toFixed(4)}</p>
                <p className="text-xs text-muted-foreground">+{bdiPercent}% sobre custo direto</p>
              </div>
            ) : (
              <p className="text-sm text-destructive font-medium">Percentuais inválidos (soma ≥ 100%)</p>
            )}
          </div>
        </section>

        <Button onClick={handleSave} disabled={saving} className="w-full font-display uppercase tracking-widest text-xs">
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminConfiguracoes;
