import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, Check, X, CreditCard, Percent } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Installment {
  label: string;
  percent: number;
}

interface PaymentPlan {
  id: string;
  name: string;
  description: string | null;
  installments: Installment[];
  is_default: boolean;
  active: boolean;
  sort_order: number;
}

const AdminPagamentos = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      await loadPlans();
    };
    init();
  }, [navigate]);

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from("payment_plans")
      .select("*")
      .order("sort_order");
    if (error) {
      toast({ title: "Erro ao carregar planos", variant: "destructive" });
    } else {
      setPlans((data || []).map((p: any) => ({
        ...p,
        installments: (p.installments as Installment[]) || [],
      })));
    }
    setLoading(false);
  };

  const startNew = () => {
    setEditingPlan({
      id: "",
      name: "",
      description: null,
      installments: [{ label: "Entrada", percent: 50 }, { label: "2ª parcela", percent: 50 }],
      is_default: false,
      active: true,
      sort_order: plans.length,
    });
    setIsNew(true);
  };

  const startEdit = (plan: PaymentPlan) => {
    setEditingPlan({ ...plan });
    setIsNew(false);
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setIsNew(false);
  };

  const addInstallment = () => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      installments: [...editingPlan.installments, { label: `${editingPlan.installments.length + 1}ª parcela`, percent: 0 }],
    });
  };

  const removeInstallment = (idx: number) => {
    if (!editingPlan || editingPlan.installments.length <= 1) return;
    setEditingPlan({
      ...editingPlan,
      installments: editingPlan.installments.filter((_, i) => i !== idx),
    });
  };

  const updateInstallment = (idx: number, field: keyof Installment, value: string | number) => {
    if (!editingPlan) return;
    const updated = [...editingPlan.installments];
    if (field === "percent") {
      updated[idx] = { ...updated[idx], percent: Number(value) || 0 };
    } else {
      updated[idx] = { ...updated[idx], label: String(value) };
    }
    setEditingPlan({ ...editingPlan, installments: updated });
  };

  const totalPercent = editingPlan?.installments.reduce((sum, i) => sum + i.percent, 0) || 0;

  const handleSave = async () => {
    if (!editingPlan) return;
    if (!editingPlan.name.trim()) {
      toast({ title: "Informe o nome do plano", variant: "destructive" });
      return;
    }
    if (Math.abs(totalPercent - 100) > 0.01) {
      toast({ title: "O total das parcelas deve ser 100%", variant: "destructive" });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload = {
      user_id: session.user.id,
      name: editingPlan.name.trim(),
      description: editingPlan.description?.trim() || null,
      installments: editingPlan.installments as any,
      is_default: editingPlan.is_default,
      active: editingPlan.active,
      sort_order: editingPlan.sort_order,
    };

    if (isNew) {
      const { error } = await supabase.from("payment_plans").insert(payload);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("payment_plans").update(payload).eq("id", editingPlan.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    }

    toast({ title: isNew ? "Plano criado!" : "Plano atualizado!" });
    setEditingPlan(null);
    setIsNew(false);
    await loadPlans();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("payment_plans").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    toast({ title: "Plano removido" });
    await loadPlans();
  };

  const toggleActive = async (plan: PaymentPlan) => {
    await supabase.from("payment_plans").update({ active: !plan.active }).eq("id", plan.id);
    await loadPlans();
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div>
            <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
              <span className="w-6 h-px bg-primary/40" />
              Financeiro
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Condições de Pagamento</h1>
            <p className="text-sm text-muted-foreground/50 mt-2 font-body">Configure planos de parcelamento para propostas de setup</p>
          </div>
          {!editingPlan && (
            <Button onClick={startNew} className="font-display uppercase tracking-[0.2em] text-[10px] py-5 px-6 relative overflow-hidden group glow-box">
              <span className="relative z-10 flex items-center gap-2"><Plus className="w-4 h-4" /> Novo Plano</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </Button>
          )}
        </motion.div>

        {/* Editor */}
        {editingPlan && (
          <div className="glass-card p-6 space-y-5 border-primary/30 border">
            <h2 className="font-display font-bold text-lg">{isNew ? "Novo Plano" : "Editar Plano"}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Plano *</Label>
                <Input value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} placeholder="Ex: Entrada + 2x" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={editingPlan.description || ""} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })} placeholder="Ex: 50% na assinatura, 2x de 25%" />
              </div>
            </div>

            {/* Installments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Parcelas</Label>
                <Button variant="outline" size="sm" onClick={addInstallment}>
                  <Plus className="w-3 h-3 mr-1" /> Parcela
                </Button>
              </div>

              <div className="space-y-2">
                {editingPlan.installments.map((inst, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border border-border/30 rounded-sm bg-card/40">
                    <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                    <span className="text-xs text-muted-foreground/60 font-display font-bold w-6">{idx + 1}.</span>
                    <Input
                      value={inst.label}
                      onChange={(e) => updateInstallment(idx, "label", e.target.value)}
                      placeholder="Nome da parcela"
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1 w-28">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={inst.percent}
                        onChange={(e) => updateInstallment(idx, "percent", e.target.value)}
                        className="w-20"
                      />
                      <Percent className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                    </div>
                    {editingPlan.installments.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeInstallment(idx)} className="text-destructive shrink-0 h-8 w-8">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total indicator */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-sm border ${Math.abs(totalPercent - 100) < 0.01 ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                <span className="text-sm font-body">Total das parcelas</span>
                <span className={`font-display font-bold text-lg ${Math.abs(totalPercent - 100) < 0.01 ? "text-green-400" : "text-destructive"}`}>
                  {totalPercent.toFixed(0)}%
                  {Math.abs(totalPercent - 100) < 0.01 && <Check className="w-4 h-4 inline ml-1" />}
                </span>
              </div>
            </div>

            {/* Preview */}
            {editingPlan.installments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Prévia (para R$ 10.000)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {editingPlan.installments.map((inst, idx) => (
                    <div key={idx} className="border border-border/20 p-3 rounded-sm text-center">
                      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block">{inst.label}</span>
                      <span className="font-display font-bold text-primary text-lg">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(10000 * inst.percent / 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={editingPlan.is_default} onCheckedChange={(v) => setEditingPlan({ ...editingPlan, is_default: v })} />
                <Label className="text-sm">Plano padrão</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingPlan.active} onCheckedChange={(v) => setEditingPlan({ ...editingPlan, active: v })} />
                <Label className="text-sm">Ativo</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} className="font-display uppercase tracking-widest text-xs">
                <Check className="w-4 h-4 mr-2" /> Salvar
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-2" /> Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Plans List */}
        {plans.length === 0 && !editingPlan ? (
          <div className="glass-card p-12 text-center">
            <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg mb-2">Nenhum plano cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">Crie planos de parcelamento para usar nas propostas de setup.</p>
            <Button onClick={startNew} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Criar primeiro plano
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`glass-card p-5 space-y-3 transition-all duration-300 cursor-pointer hover:border-primary/30 ${!plan.active ? "opacity-50" : ""} ${editingPlan?.id === plan.id ? "border-primary/50" : ""}`}
                onClick={() => startEdit(plan)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold">{plan.name}</h3>
                    {plan.is_default && (
                      <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-sm uppercase tracking-wider font-semibold">Padrão</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch checked={plan.active} onCheckedChange={() => toggleActive(plan)} />
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDelete(plan.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {plan.description && (
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {plan.installments.map((inst, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs bg-card/60 border border-border/20 px-2.5 py-1 rounded-sm">
                      <span className="text-muted-foreground">{inst.label}:</span>
                      <span className="font-display font-bold text-primary">{inst.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPagamentos;
