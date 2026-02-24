import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Shield } from "lucide-react";

const MODULES = [
  { key: "propostas", label: "Propostas" },
  { key: "contratos", label: "Contratos" },
  { key: "servicos", label: "Serviços & Cases" },
  { key: "atendimento", label: "Atendimento" },
  { key: "comunicacoes", label: "Comunicações" },
  { key: "pagamentos", label: "Pagamentos" },
  { key: "integracoes", label: "Integrações" },
  { key: "configuracoes", label: "Configurações" },
  { key: "usuarios", label: "Usuários" },
  { key: "auditoria", label: "Auditoria" },
] as const;

type Permission = { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean };
type PermissionsMap = Record<string, Permission>;

const defaultPerm = (): Permission => ({ can_view: false, can_create: false, can_edit: false, can_delete: false });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export default function UserPermissionsDialog({ open, onOpenChange, userId, userName }: Props) {
  const [perms, setPerms] = useState<PermissionsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    supabase
      .from("user_module_access")
      .select("module, can_view, can_create, can_edit, can_delete")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        const map: PermissionsMap = {};
        MODULES.forEach((m) => (map[m.key] = defaultPerm()));
        if (!error && data) {
          data.forEach((row) => {
            map[row.module] = {
              can_view: row.can_view,
              can_create: row.can_create,
              can_edit: row.can_edit,
              can_delete: row.can_delete,
            };
          });
        }
        setPerms(map);
        setLoading(false);
      });
  }, [open, userId]);

  const toggle = (mod: string, field: keyof Permission) => {
    setPerms((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [field]: !prev[mod][field] },
    }));
  };

  const toggleAllModule = (mod: string, checked: boolean) => {
    setPerms((prev) => ({
      ...prev,
      [mod]: { can_view: checked, can_create: checked, can_edit: checked, can_delete: checked },
    }));
  };

  const isAllChecked = (mod: string) => {
    const p = perms[mod];
    return p && p.can_view && p.can_create && p.can_edit && p.can_delete;
  };

  const save = async () => {
    setSaving(true);
    try {
      // Delete existing then insert all
      await supabase.from("user_module_access").delete().eq("user_id", userId);

      const rows = MODULES.map((m) => ({
        user_id: userId,
        module: m.key,
        ...perms[m.key],
      }));

      const { error } = await supabase.from("user_module_access").insert(rows);
      if (error) throw error;

      toast({ title: "Permissões salvas" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const ACTIONS: { key: keyof Permission; label: string }[] = [
    { key: "can_view", label: "Ver" },
    { key: "can_create", label: "Criar" },
    { key: "can_edit", label: "Editar" },
    { key: "can_delete", label: "Excluir" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Permissões — {userName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/60">
            Selecione quais módulos e ações este usuário pode acessar.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_repeat(5,56px)] bg-muted/50 border-b text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              <div className="px-3 py-2">Módulo</div>
              <div className="px-1 py-2 text-center">Todos</div>
              {ACTIONS.map((a) => (
                <div key={a.key} className="px-1 py-2 text-center">{a.label}</div>
              ))}
            </div>

            {/* Rows */}
            {MODULES.map((mod) => (
              <div
                key={mod.key}
                className="grid grid-cols-[1fr_repeat(5,56px)] border-b last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <div className="px-3 py-2.5 text-sm font-medium">{mod.label}</div>
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={isAllChecked(mod.key)}
                    onCheckedChange={(checked) => toggleAllModule(mod.key, !!checked)}
                  />
                </div>
                {ACTIONS.map((a) => (
                  <div key={a.key} className="flex items-center justify-center">
                    <Checkbox
                      checked={perms[mod.key]?.[a.key] ?? false}
                      onCheckedChange={() => toggle(mod.key, a.key)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar permissões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
