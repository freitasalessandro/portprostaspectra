import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const VARIABLES = [
  { key: "{{cliente}}", label: "Cliente" },
  { key: "{{projeto}}", label: "Projeto" },
  { key: "{{valor}}", label: "Valor Total" },
  { key: "{{valor_recorrente}}", label: "Valor Recorrente" },
  { key: "{{link}}", label: "Link" },
  { key: "{{codigo}}", label: "Código de Acesso" },
  { key: "{{data_validade}}", label: "Data Validade" },
  { key: "{{hora}}", label: "Hora" },
  { key: "{{protocolo}}", label: "Protocolo" },
  { key: "{{contrato_titulo}}", label: "Título do Contrato" },
  { key: "{{contrato_link}}", label: "Link do Contrato" },
  { key: "{{contrato_codigo}}", label: "Código do Contrato" },
];

interface Template {
  id: string;
  name: string;
  channel: string;
  message: string;
}

const AdminComunicacoesModelos = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Template> | null>(null);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchTemplates = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data } = await supabase
      .from("communication_templates")
      .select("id, name, channel, message")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    setTemplates(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const insertVariable = (varKey: string) => {
    const ta = textareaRef.current;
    if (!ta || !editing) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const current = editing.message || "";
    const newMsg = current.substring(0, start) + varKey + current.substring(end);
    setEditing({ ...editing, message: newMsg });
    setTimeout(() => {
      ta.focus();
      const pos = start + varKey.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleSave = async () => {
    if (!editing?.name?.trim() || !editing?.message?.trim()) {
      toast({ title: "Preencha nome e mensagem", variant: "destructive" });
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setSaving(true);

    if (editing.id) {
      const { error } = await supabase.from("communication_templates").update({
        name: editing.name,
        channel: editing.channel || "whatsapp",
        message: editing.message,
      }).eq("id", editing.id);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Modelo atualizado" });
    } else {
      const { error } = await supabase.from("communication_templates").insert({
        name: editing.name,
        channel: editing.channel || "whatsapp",
        message: editing.message,
        user_id: session.user.id,
      });
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Modelo criado" });
    }
    setSaving(false);
    setEditing(null);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("communication_templates").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Modelo removido" }); fetchTemplates(); }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
            <span className="w-6 h-px bg-primary/40" /> Comunicações
          </p>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Modelos</h1>
            {!editing && (
              <Button size="sm" onClick={() => setEditing({ name: "", channel: "whatsapp", message: "" })} className="text-xs uppercase tracking-widest">
                <Plus className="w-3.5 h-3.5 mr-1" /> Novo modelo
              </Button>
            )}
          </div>
        </motion.div>

        {editing && (
          <motion.div className="glass-card p-6 mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {editing.id ? "Editar modelo" : "Novo modelo"}
              </h2>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Nome</label>
                <Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Ex: Notificação de aprovação" className="text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Canal</label>
                <Input value="WhatsApp" disabled className="text-sm bg-muted/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Variáveis disponíveis</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-mono hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Mensagem</label>
                <Textarea
                  ref={textareaRef}
                  value={editing.message || ""}
                  onChange={(e) => setEditing({ ...editing, message: e.target.value })}
                  placeholder="Olá {{cliente}}, sua proposta para {{projeto}} no valor de {{valor}} foi aprovada!"
                  className="min-h-[120px] font-mono text-xs"
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full text-xs uppercase tracking-widest">
                <Save className="w-3.5 h-3.5 mr-1" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-center py-10">Carregando...</p>
        ) : templates.length === 0 && !editing ? (
          <p className="text-muted-foreground text-center py-10">Nenhum modelo cadastrado.</p>
        ) : (
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-sm">{t.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">WhatsApp</Badge></TableCell>
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

export default AdminComunicacoesModelos;
