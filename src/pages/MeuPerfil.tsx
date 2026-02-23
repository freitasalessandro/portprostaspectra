import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Camera, Save, User, Mail, Lock, Eye, EyeOff, MessageSquare, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cargoLabels, cargoColors, type AtendenteCargo } from "@/hooks/useAtendimento";

export default function MeuPerfil() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [assinaturaAtiva, setAssinaturaAtiva] = useState(true);
  const [assinaturaPadrao, setAssinaturaPadrao] = useState("");
  const [cargo, setCargo] = useState<AtendenteCargo>("n1_triagem");

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setEmail(user.email || "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url || null);
    }

    const { data: atendente } = await supabase
      .from("atendentes_perfil")
      .select("assinatura_ativa, assinatura_padrao, cargo")
      .eq("user_id", user.id)
      .maybeSingle();

    if (atendente) {
      setAssinaturaAtiva(atendente.assinatura_ativa);
      setAssinaturaPadrao(atendente.assinatura_padrao || "");
      setCargo((atendente as any).cargo || "n1_triagem");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!userId || !displayName.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("user_id", userId);

    // Also update atendentes_perfil name + signature settings
    await supabase
      .from("atendentes_perfil")
      .update({
        nome_completo: displayName.trim(),
        assinatura_ativa: assinaturaAtiva,
        assinatura_padrao: assinaturaPadrao.trim() || null,
      })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máximo de 2MB", variant: "destructive" });
      return;
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("company-assets")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();

    await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", userId);
    setAvatarUrl(url);
    toast({ title: "Avatar atualizado!" });
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo de 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso!" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-display font-bold">Meu Perfil</h1>

        {/* Avatar & Name */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                <Avatar className="w-20 h-20 border-2 border-border">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{displayName || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Nome completo
                </Label>
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Seu nome completo"
                />
                <p className="text-[11px] text-muted-foreground">
                  Este nome será usado como assinatura nas mensagens do atendimento.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> E-mail
                </Label>
                <Input value={email} disabled className="opacity-60" />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>

        {/* Cargo / Nível */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" /> Nível de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`text-xs px-3 py-1 font-semibold border ${cargoColors[cargo]}`}>
                {cargoLabels[cargo]}
              </Badge>
              <p className="text-[11px] text-muted-foreground">
                {cargo === "n1_triagem" && "Responsável pela triagem inicial e encaminhamento de tickets."}
                {cargo === "n2_tecnico" && "Atendimento técnico especializado e resolução avançada."}
                {cargo === "supervisor" && "Supervisão da equipe, acesso a todos os tickets e métricas."}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-3">
              Seu cargo é definido pelo administrador do sistema.
            </p>
          </CardContent>
        </Card>

        {/* Signature */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Assinatura no Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs">Assinar mensagens com meu nome</Label>
                <p className="text-[11px] text-muted-foreground">
                  Prefixar mensagens com <strong>*Seu Nome:*</strong> antes do conteúdo
                </p>
              </div>
              <Switch checked={assinaturaAtiva} onCheckedChange={setAssinaturaAtiva} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Assinatura personalizada (opcional)</Label>
              <Textarea
                value={assinaturaPadrao}
                onChange={e => setAssinaturaPadrao(e.target.value)}
                placeholder="Ex: Equipe Spectra — spectra.tec.br"
                rows={2}
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Se preenchida, será adicionada ao final das mensagens de texto.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="w-4 h-4" /> Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Nova senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Confirmar nova senha</Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>
            <Button
              variant="outline"
              onClick={handlePasswordChange}
              disabled={changingPassword || !newPassword}
              className="w-full"
            >
              {changingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}