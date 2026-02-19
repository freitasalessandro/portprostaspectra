import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText, ListChecks, ClipboardList, Brain, PenTool, Code2,
  Palette, Share2, Globe, Megaphone, ExternalLink, Plus, Pencil, Trash2, GripVertical,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  FileText, ListChecks, ClipboardList, Brain, PenTool, Code2,
  Palette, Share2, Globe, Megaphone,
};

const iconOptions = Object.keys(iconMap);

const sectionLabels: Record<string, string> = {
  saas: "Arsenal Spectra",
  custom: "Desenvolvimento sob medida",
  design: "Inteligência em Design",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  production: { label: "Em produção", color: "bg-green-500/20 text-green-400" },
  development: { label: "Em desenvolvimento", color: "bg-primary/20 text-primary" },
};

interface Service {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  status: string;
  link: string | null;
  section: string;
  sort_order: number;
  user_id: string;
}

const emptyForm = {
  title: "",
  category: "",
  description: "",
  icon: "FileText",
  status: "production",
  link: "",
  section: "saas",
};

const AdminServicos = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      fetchServices();
    };
    check();
  }, [navigate]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("section")
      .order("sort_order");
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setServices((data as Service[]) || []);
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      category: s.category,
      description: s.description,
      icon: s.icon,
      status: s.status,
      link: s.link || "",
      section: s.section,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload = {
      title: form.title,
      category: form.category,
      description: form.description,
      icon: form.icon,
      status: form.status,
      link: form.link || null,
      section: form.section,
      user_id: session.user.id,
    };

    if (editingId) {
      const { error } = await supabase.from("services").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Serviço atualizado" });
    } else {
      const maxOrder = services.filter(s => s.section === form.section).length;
      const { error } = await supabase.from("services").insert({ ...payload, sort_order: maxOrder });
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Serviço criado" });
    }
    setDialogOpen(false);
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Serviço excluído" });
    fetchServices();
  };

  const grouped = ["saas", "custom", "design"].map(section => ({
    section,
    label: sectionLabels[section],
    items: services.filter(s => s.section === section),
  }));

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl font-bold">Serviços</h1>
          <Button onClick={openNew} className="font-display uppercase tracking-widest text-xs">
            <Plus className="w-4 h-4 mr-2" /> Novo Serviço
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Carregando...</div>
        ) : (
          grouped.map(group => (
            <div key={group.section} className="mb-10">
              <h2 className="font-display text-lg font-bold mb-1">{group.label}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {group.items.length} serviço{group.items.length !== 1 ? "s" : ""}
              </p>
              {group.items.length === 0 ? (
                <div className="glass-card p-6 text-center text-muted-foreground text-sm">
                  Nenhum serviço nesta categoria.
                </div>
              ) : (
                <div className="grid gap-3">
                  {group.items.map(s => {
                    const Icon = iconMap[s.icon] || FileText;
                    const st = statusConfig[s.status] || statusConfig.production;
                    return (
                      <div key={s.id} className="glass-card p-4 flex items-start gap-4 group hover:border-primary/40 transition-all duration-300">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-display font-bold text-base truncate">{s.title}</h3>
                            <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-bold ${st.color}`}>
                              {st.label}
                            </span>
                          </div>
                          <p className="text-[11px] uppercase tracking-widest text-primary/60 mb-1">{s.category}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {s.link && (
                            <a href={s.link} target="_blank" rel="noopener noreferrer"
                              className="w-8 h-8 rounded-md border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)} className="w-8 h-8">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="w-8 h-8 text-destructive hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Editar Serviço" : "Novo Serviço"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Título</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Categoria</label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: SaaS · Fintech" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Descrição</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Seção</label>
                <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saas">Arsenal Spectra</SelectItem>
                    <SelectItem value="custom">Sob medida</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Em produção</SelectItem>
                    <SelectItem value="development">Em dev</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Ícone</label>
                <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(name => {
                      const I = iconMap[name];
                      return (
                        <SelectItem key={name} value={name}>
                          <span className="flex items-center gap-2"><I className="w-3.5 h-3.5" /> {name}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Link externo (opcional)</label>
              <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
            </div>
            <Button onClick={handleSave} className="w-full font-display uppercase tracking-widest text-xs" disabled={!form.title || !form.category || !form.description}>
              {editingId ? "Salvar alterações" : "Criar serviço"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminServicos;
