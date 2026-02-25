import { useEffect, useState } from "react";
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

const MODULE_LIST = [
  { key: "propostas", label: "Propostas" },
  { key: "contratos", label: "Contratos" },
  { key: "atendimento", label: "Atendimento" },
  { key: "catalogo", label: "Catálogo" },
  { key: "comunicacoes", label: "Comunicações" },
  { key: "pagamentos", label: "Pagamentos" },
  { key: "usuarios", label: "Usuários" },
  { key: "integracoes", label: "Integrações" },
  { key: "auditoria", label: "Auditoria" },
  { key: "configuracoes", label: "Configurações" },
] as const;

const ACTIONS = ["can_view", "can_create", "can_edit", "can_delete"] as const;
const ACTION_LABELS: Record<string, string> = {
  can_view: "Ver",
  can_create: "Criar",
  can_edit: "Editar",
  can_delete: "Excluir",
};

type ModuleAccess = {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const UserPermissionsDialog = ({ open, onOpenChange, userId, userName }: UserPermissionsDialogProps) => {
  const [permissions, setPermissions] = useState<ModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    fetchPermissions();
  }, [open, userId]);

  const fetchPermissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_module_access")
      .select("module, can_view, can_create, can_edit, can_delete")
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const existingMap: Record<string, ModuleAccess> = {};
    (data || []).forEach((d: any) => {
      existingMap[d.module] = d;
    });

    const merged = MODULE_LIST.map((m) => ({
      module: m.key,
      can_view: existingMap[m.key]?.can_view ?? false,
      can_create: existingMap[m.key]?.can_create ?? false,
      can_edit: existingMap[m.key]?.can_edit ?? false,
      can_delete: existingMap[m.key]?.can_delete ?? false,
    }));

    setPermissions(merged);
    setLoading(false);
  };

  const togglePermission = (moduleKey: string, action: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.module === moduleKey ? { ...p, [action]: !p[action as keyof ModuleAccess] } : p
      )
    );
  };

  const toggleAllForModule = (moduleKey: string, value: boolean) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.module === moduleKey
          ? { ...p, can_view: value, can_create: value, can_edit: value, can_delete: value }
          : p
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing permissions for this user
      await supabase.from("user_module_access").delete().eq("user_id", userId);

      // Insert all permissions
      const rows = permissions
        .filter((p) => p.can_view || p.can_create || p.can_edit || p.can_delete)
        .map((p) => ({
          user_id: userId,
          module: p.module,
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
        }));

      if (rows.length > 0) {
        const { error } = await supabase.from("user_module_access").insert(rows);
        if (error) throw error;
      }

      toast({ title: "Permissões salvas!" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const allChecked = (moduleKey: string) => {
    const p = permissions.find((p) => p.module === moduleKey);
    return p ? p.can_view && p.can_create && p.can_edit && p.can_delete : false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Permissões — {userName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/60">
            Defina quais módulos e ações este usuário pode acessar.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2.5 px-2 font-display text-xs uppercase tracking-widest text-muted-foreground/60">
                    Módulo
                  </th>
                  {ACTIONS.map((a) => (
                    <th key={a} className="text-center py-2.5 px-2 font-display text-xs uppercase tracking-widest text-muted-foreground/60">
                      {ACTION_LABELS[a]}
                    </th>
                  ))}
                  <th className="text-center py-2.5 px-2 font-display text-xs uppercase tracking-widest text-muted-foreground/60">
                    Todos
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODULE_LIST.map((mod) => {
                  const perm = permissions.find((p) => p.module === mod.key);
                  return (
                    <tr key={mod.key} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-2 font-medium text-xs">{mod.label}</td>
                      {ACTIONS.map((action) => (
                        <td key={action} className="text-center py-2.5 px-2">
                          <Checkbox
                            checked={perm?.[action] ?? false}
                            onCheckedChange={() => togglePermission(mod.key, action)}
                            className="mx-auto"
                          />
                        </td>
                      ))}
                      <td className="text-center py-2.5 px-2">
                        <Checkbox
                          checked={allChecked(mod.key)}
                          onCheckedChange={(checked) => toggleAllForModule(mod.key, !!checked)}
                          className="mx-auto"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar permissões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserPermissionsDialog;
