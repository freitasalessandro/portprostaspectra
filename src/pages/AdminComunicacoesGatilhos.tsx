import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const EVENTS = [
  { value: "proposta_enviada", label: "Proposta enviada", group: "Propostas" },
  { value: "proposta_visualizada", label: "Proposta visualizada", group: "Propostas" },
  { value: "proposta_aprovada", label: "Proposta aprovada", group: "Propostas" },
  { value: "proposta_expirada", label: "Proposta expirada", group: "Propostas" },
  { value: "contrato_enviado", label: "Contrato enviado para assinatura", group: "Contratos" },
  { value: "contrato_visualizado", label: "Contrato visualizado", group: "Contratos" },
  { value: "contrato_assinado", label: "Contrato assinado", group: "Contratos" },
];

const RECIPIENTS = [
  { value: "cliente", label: "Cliente" },
  { value: "comercial", label: "Comercial" },
  { value: "ambos", label: "Ambos" },
];

interface Template { id: string; name: string; }
interface Trigger {
  id: string;
  event: string;
  template_id: string;
  recipient: string;
  active: boolean;
}

const AdminComunicacoesGatilhos = () => {
  const navigate = useNavigate();
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Trigger> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const [trRes, tplRes] = await Promise.all([
      supabase.from("communication_triggers").select("id, event, template_id, recipient, active").eq("user_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("communication_templates").select("id, name").eq("user_id", session.user.id).order("name"),
    ]);
    setTriggers(trRes.data || []);
    setTemplates(tplRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!editing?.event || !editing?.template_id || !editing?.recipient) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setSaving(true);

    const payload = { event: editing.event, template_id: editing.template_id, recipient: editing.recipient, active: editing.active ?? true };

    if (editing.id) {
      const { error } = await supabase.from("communication_triggers").update(payload).eq("id", editing.id);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Gatilho atualizado" });
    } else {
      const { error } = await supabase.from("communication_triggers").insert({ ...payload, user_id: session.user.id });
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Gatilho criado" });
    }
    setSaving(false);
    setEditing(null);
    fetchData();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from("communication_triggers").update({ active: !active }).eq("id", id);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("communication_triggers").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Gatilho removido" }); fetchData(); }
  };

  const eventLabel = (v: string) => EVENTS.find(e => e.value === v)?.label || v;
  const recipientLabel = (v: string) => RECIPIENTS.find(r => r.value === v)?.label || v;
  const templateName = (id: string) => templates.find(t => t.id === id)?.name || "—";

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
            <span className="w-6 h-px bg-primary/40" /> Comunicações
          </p>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Gatilhos</h1>
            {!editing && (
              <Button size="sm" onClick={() => setEditing({ event: "", template_id: "", recipient: "cliente", active: true })} className="text-xs uppercase tracking-widest">
                <Plus className="w-3.5 h-3.5 mr-1" /> Novo gatilho
              </Button>
            )}
          </div>
        </motion.div>

        {editing && (
          <motion.div className="glass-card p-6 mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">{editing.id ? "Editar" : "Novo gatilho"}</h2>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Evento</label>
                <select value={editing.event || ""} onChange={(e) => setEditing({ ...editing, event: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Selecione...</option>
                  <optgroup label="Propostas">
                    {EVENTS.filter(e => e.group === "Propostas").map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </optgroup>
                  <optgroup label="Contratos">
                    {EVENTS.filter(e => e.group === "Contratos").map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Modelo vinculado</label>
                <select value={editing.template_id || ""} onChange={(e) => setEditing({ ...editing, template_id: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Selecione...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {templates.length === 0 && <p className="text-xs text-destructive mt-1">Crie um modelo primeiro em "Modelos".</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Destinatário</label>
                <select value={editing.recipient || "cliente"} onChange={(e) => setEditing({ ...editing, recipient: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {RECIPIENTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                <span className="text-sm">{editing.active ? "Ativo" : "Inativo"}</span>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full text-xs uppercase tracking-widest">
                <Save className="w-3.5 h-3.5 mr-1" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-center py-10">Carregando...</p>
        ) : triggers.length === 0 && !editing ? (
          <p className="text-muted-foreground text-center py-10">Nenhum gatilho cadastrado.</p>
        ) : (
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {triggers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{eventLabel(t.event)}</TableCell>
                    <TableCell className="text-sm">{templateName(t.template_id)}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{recipientLabel(t.recipient)}</Badge></TableCell>
                    <TableCell>
                      <Switch checked={t.active} onCheckedChange={() => handleToggle(t.id, t.active)} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(t)} className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)} className="h-8 w-8 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminComunicacoesGatilhos;
