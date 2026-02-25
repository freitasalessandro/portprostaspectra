import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdminLayout from "@/features/admin/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plug, Bot, Eye, EyeOff, Check, Sparkles, MessageCircle, Send, Loader2 } from "lucide-react";

type AiProvider = "lovable" | "anthropic";

interface IntegrationState {
  id?: string;
  ai_provider: AiProvider;
  anthropic_api_key: string;
  evolution_api_url: string;
  evolution_api_token: string;
  evolution_api_instance: string;
}

const providers: { value: AiProvider; label: string; description: string }[] = [
  {
    value: "lovable",
    label: "Lovable AI (padrão)",
    description: "GPT-5 e Gemini integrados — sem necessidade de API key.",
  },
  {
    value: "anthropic",
    label: "Claude (Anthropic)",
    description: "Use sua própria API key para gerar propostas com o Claude.",
  },
];

const AdminIntegracoes = () => {
  const [state, setState] = useState<IntegrationState>({
    ai_provider: "lovable",
    anthropic_api_key: "",
    evolution_api_url: "https://wpp.spectra.tec.br",
    evolution_api_token: "",
    evolution_api_instance: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showEvoToken, setShowEvoToken] = useState(false);
  const [testNumber, setTestNumber] = useState("");
  const [testing, setTesting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data } = await supabase
        .from("company_settings")
        .select("id, ai_provider, anthropic_api_key, evolution_api_url, evolution_api_token, evolution_api_instance")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (data) {
        setState({
          id: data.id,
          ai_provider: ((data as any).ai_provider as AiProvider) || "lovable",
          anthropic_api_key: (data as any).anthropic_api_key || "",
          evolution_api_url: (data as any).evolution_api_url || "https://wpp.spectra.tec.br",
          evolution_api_token: (data as any).evolution_api_token || "",
          evolution_api_instance: (data as any).evolution_api_instance || "",
        });
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setSaving(true);

    const payload = {
      ai_provider: state.ai_provider,
      anthropic_api_key: state.anthropic_api_key || null,
      evolution_api_url: state.evolution_api_url || null,
      evolution_api_token: state.evolution_api_token || null,
      evolution_api_instance: state.evolution_api_instance || null,
      user_id: session.user.id,
    } as any;

    let error;
    if (state.id) {
      ({ error } = await supabase.from("company_settings").update(payload).eq("id", state.id));
    } else {
      const res = await supabase.from("company_settings").insert(payload).select().single();
      error = res.error;
      if (res.data) setState(prev => ({ ...prev, id: res.data.id }));
    }

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Integrações atualizadas" });
    }
    setSaving(false);
  };

  const handleTestWhatsApp = async () => {
    if (!testNumber.trim() || !state.evolution_api_token || !state.evolution_api_instance) {
      toast({ title: "Preencha o token, instância e número de teste", variant: "destructive" });
      return;
    }
    setTesting(true);
    // Save settings first so the edge function can read them
    await handleSave();
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: testNumber.trim(),
          message: "✅ Teste de integração Spectra × Evolution API realizado com sucesso!",
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erro na API", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Mensagem enviada!", description: `Teste enviado para ${testNumber}` });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao enviar", variant: "destructive" });
    }
    setTesting(false);
  };

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
        <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
            <span className="w-6 h-px bg-primary/40" />
            Sistema
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Integrações</h1>
        </motion.div>

        {/* AI Provider selector */}
        <section className="glass-card p-6 mb-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4" /> Provedor de IA
          </h2>
          <div className="space-y-3">
            {providers.map((p) => (
              <label
                key={p.value}
                className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  state.ai_provider === p.value
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/30 hover:border-border/60"
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  state.ai_provider === p.value ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}>
                  {state.ai_provider === p.value && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-semibold">{p.label}</span>
                    {p.value === "lovable" && <Sparkles className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                </div>
                <input
                  type="radio"
                  name="ai_provider"
                  value={p.value}
                  checked={state.ai_provider === p.value}
                  onChange={() => setState(prev => ({ ...prev, ai_provider: p.value }))}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Anthropic API key */}
        {state.ai_provider === "anthropic" && (
          <motion.section
            className="glass-card p-6 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Plug className="w-4 h-4" /> API Key — Anthropic
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Obtenha sua chave em{" "}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                console.anthropic.com
              </a>
            </p>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={state.anthropic_api_key}
                onChange={(e) => setState(prev => ({ ...prev, anthropic_api_key: e.target.value }))}
                placeholder="sk-ant-api03-..."
                className="pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {state.anthropic_api_key && !state.anthropic_api_key.startsWith("sk-ant-") && (
              <p className="text-xs text-destructive mt-2">A chave deve começar com "sk-ant-"</p>
            )}
          </motion.section>
        )}

        {/* Evolution API — WhatsApp */}
        <section className="glass-card p-6 mb-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> WhatsApp — Evolution API
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Notificações automáticas via WhatsApp quando propostas forem aprovadas.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">URL da API</label>
              <Input
                value={state.evolution_api_url}
                onChange={(e) => setState(prev => ({ ...prev, evolution_api_url: e.target.value }))}
                placeholder="https://wpp.spectra.tec.br"
                className="font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Nome da Instância</label>
              <Input
                value={state.evolution_api_instance}
                onChange={(e) => setState(prev => ({ ...prev, evolution_api_instance: e.target.value }))}
                placeholder="spectra"
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">API Token</label>
              <div className="relative">
                <Input
                  type={showEvoToken ? "text" : "password"}
                  value={state.evolution_api_token}
                  onChange={(e) => setState(prev => ({ ...prev, evolution_api_token: e.target.value }))}
                  placeholder="Token da Evolution API"
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowEvoToken(!showEvoToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showEvoToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Test section */}
            {state.evolution_api_token && state.evolution_api_instance && (
              <div className="border-t border-border/20 pt-3 mt-3">
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Testar envio</label>
                <div className="flex gap-2">
                  <Input
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    placeholder="5582999999999"
                    className="font-mono text-xs flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestWhatsApp}
                    disabled={testing || !testNumber.trim()}
                    className="shrink-0 text-xs"
                  >
                    {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        <Button onClick={handleSave} disabled={saving} className="w-full font-display uppercase tracking-widest text-xs">
          {saving ? "Salvando..." : "Salvar integrações"}
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminIntegracoes;
