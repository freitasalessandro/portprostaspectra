import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { AtendenteCargo } from "@/hooks/useAtendimento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mail, UserPlus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function UserInviteDialog({ open, onOpenChange, onCreated }: Props) {
  const [createMode, setCreateMode] = useState<"invite" | "create">("create");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [cargo, setCargo] = useState<AtendenteCargo>("n1_triagem");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setEmail("");
    setName("");
    setPassword("");
    setRole("viewer");
    setCargo("n1_triagem");
  };

  const handleSubmit = async () => {
    if (!email.trim()) return;
    if (createMode === "create" && (!password || password.length < 6)) {
      toast({ title: "Erro", description: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      const body =
        createMode === "create"
          ? { action: "create", email: email.trim(), password, display_name: name.trim(), role, cargo }
          : { action: "invite", email: email.trim(), display_name: name.trim(), role, cargo };

      const { data, error } = await supabase.functions.invoke("manage-users", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: createMode === "create" ? "Usuário criado!" : "Convite enviado!",
        description: createMode === "create" ? `Conta criada para ${email}` : `E-mail enviado para ${email}`,
      });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30">
        <DialogHeader>
          <DialogTitle className="font-display">
            {createMode === "create" ? "Criar usuário" : "Convidar usuário"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/60">
            {createMode === "create"
              ? "Crie uma conta com e-mail e senha definidos."
              : "Um e-mail será enviado com o link de acesso."}
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-md">
          <button
            onClick={() => setCreateMode("create")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              createMode === "create" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Criar conta
          </button>
          <button
            onClick={() => setCreateMode("invite")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              createMode === "invite" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Enviar convite
          </button>
        </div>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">E-mail *</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" type="email" className="text-sm" />
          </div>
          {createMode === "create" && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Senha *</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" type="password" className="text-sm" />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className="text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Papel</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin — acesso total</SelectItem>
                <SelectItem value="editor">Editor — pode criar e editar</SelectItem>
                <SelectItem value="viewer">Visualizador — somente leitura</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Cargo</label>
            <Select value={cargo} onValueChange={(v) => setCargo(v as AtendenteCargo)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="n1_triagem">N1 · Triagem</SelectItem>
                <SelectItem value="n2_tecnico">N2 · Técnico</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !email.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : createMode === "create" ? <UserPlus className="w-4 h-4 mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
            {createMode === "create" ? "Criar usuário" : "Enviar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
