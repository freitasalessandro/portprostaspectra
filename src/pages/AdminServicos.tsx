import { useEffect, useState, useRef } from "react";
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
  Palette, Share2, Globe, Megaphone, ExternalLink, Plus, Pencil, Trash2, Briefcase,
  Upload, X, Image, Film, FileIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  is_case: boolean;
  metric: string | null;
  metric_label: string | null;
}

interface ServiceFile {
  id: string;
  service_id: string;
  file_path: string;
  file_type: string;
  sort_order: number;
}

const emptyForm = {
  title: "",
  category: "",
  description: "",
  icon: "FileText",
  status: "production",
  link: "",
  section: "saas",
  is_case: false,
  metric: "",
  metric_label: "",
};

interface Category {
  id: string;
  name: string;
  active: boolean;
}

const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from("service-files").getPublicUrl(path);
  return data.publicUrl;
};

const getFileType = (name: string): string => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  return "other";
};

const AdminServicos = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceFiles, setServiceFiles] = useState<Record<string, ServiceFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [editFiles, setEditFiles] = useState<ServiceFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      fetchData();
    };
    check();
  }, [navigate]);

  const fetchData = async () => {
    const [servicesRes, categoriesRes, filesRes] = await Promise.all([
      supabase.from("services").select("*").order("section").order("sort_order"),
      supabase.from("service_categories").select("*").eq("active", true).order("sort_order"),
      supabase.from("service_files").select("*").order("sort_order"),
    ]);
    if (!servicesRes.error) setServices((servicesRes.data as Service[]) || []);
    if (!categoriesRes.error) setCategories((categoriesRes.data as Category[]) || []);
    if (!filesRes.error) {
      const grouped: Record<string, ServiceFile[]> = {};
      (filesRes.data as ServiceFile[])?.forEach(f => {
        if (!grouped[f.service_id]) grouped[f.service_id] = [];
        grouped[f.service_id].push(f);
      });
      setServiceFiles(grouped);
    }
    setLoading(false);
  };

  const fetchServices = fetchData;

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setEditFiles([]);
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
      is_case: s.is_case,
      metric: s.metric || "",
      metric_label: s.metric_label || "",
    });
    setEditFiles(serviceFiles[s.id] || []);
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
      is_case: form.is_case,
      metric: form.metric || null,
      metric_label: form.metric_label || null,
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingId || !e.target.files?.length) return;
    setUploading(true);

    const files = Array.from(e.target.files);
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${editingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("service-files")
        .upload(path, file);

      if (uploadError) {
        toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
        continue;
      }

      const fileType = getFileType(file.name);
      const { error: dbError } = await supabase.from("service_files").insert({
        service_id: editingId,
        file_path: path,
        file_type: fileType,
        sort_order: editFiles.length,
      });

      if (dbError) {
        toast({ title: "Erro", description: dbError.message, variant: "destructive" });
      }
    }

    // Refresh files
    const { data } = await supabase.from("service_files").select("*").eq("service_id", editingId).order("sort_order");
    setEditFiles((data as ServiceFile[]) || []);
    setUploading(false);
    fetchServices();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileDelete = async (file: ServiceFile) => {
    await supabase.storage.from("service-files").remove([file.file_path]);
    await supabase.from("service_files").delete().eq("id", file.id);
    setEditFiles(prev => prev.filter(f => f.id !== file.id));
    fetchServices();
    toast({ title: "Arquivo removido" });
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
                    const files = serviceFiles[s.id] || [];
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
                            {s.is_case && (
                              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-bold bg-accent/20 text-accent-foreground flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> Case
                              </span>
                            )}
                            {files.length > 0 && (
                              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-bold bg-muted text-muted-foreground flex items-center gap-1">
                                <Image className="w-3 h-3" /> {files.length}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] uppercase tracking-widest text-primary/60 mb-1">{s.category}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                          {/* Thumbnail strip */}
                          {files.length > 0 && (
                            <div className="flex gap-1.5 mt-2 overflow-x-auto">
                              {files.slice(0, 5).map(f => (
                                <div key={f.id} className="w-12 h-8 rounded border border-border/30 overflow-hidden shrink-0 bg-card/50">
                                  {f.file_type === "image" ? (
                                    <img src={getPublicUrl(f.file_path)} alt="" className="w-full h-full object-cover" />
                                  ) : f.file_type === "video" ? (
                                    <div className="w-full h-full flex items-center justify-center"><Film className="w-3 h-3 text-muted-foreground" /></div>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center"><FileIcon className="w-3 h-3 text-muted-foreground" /></div>
                                  )}
                                </div>
                              ))}
                              {files.length > 5 && <span className="text-[10px] text-muted-foreground self-center ml-1">+{files.length - 5}</span>}
                            </div>
                          )}
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Métrica (opcional)</label>
                <Input value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))} placeholder="Ex: +300%" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Label da métrica</label>
                <Input value={form.metric_label} onChange={e => setForm(f => ({ ...f, metric_label: e.target.value }))} placeholder="Ex: aumento em vendas" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/50 p-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest block">Case</label>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Exibir como case na landing page e no módulo Cases</p>
              </div>
              <Switch checked={form.is_case} onCheckedChange={v => setForm(f => ({ ...f, is_case: v }))} />
            </div>

            {/* File Upload - only for existing services */}
            {editingId && (
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Arquivos</label>

                {/* Existing files */}
                {editFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {editFiles.map(f => (
                      <div key={f.id} className="relative group/file rounded-md overflow-hidden border border-border/30 bg-card/50 aspect-video">
                        {f.file_type === "image" ? (
                          <img src={getPublicUrl(f.file_path)} alt="" className="w-full h-full object-cover" />
                        ) : f.file_type === "video" ? (
                          <video src={getPublicUrl(f.file_path)} className="w-full h-full object-cover" muted />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <button
                          onClick={() => handleFileDelete(f)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1">
                          {f.file_type === "video" && <Film className="w-3.5 h-3.5 text-primary-foreground drop-shadow" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md border border-dashed border-border/50 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload className="w-4 h-4" />
                  {uploading ? "Enviando..." : "Adicionar arquivos (PNG, JPG, MP4...)"}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
                <p className="text-[10px] text-muted-foreground/50 mt-1">Salve o serviço primeiro para poder adicionar arquivos.</p>
              </div>
            )}

            {!editingId && (
              <p className="text-xs text-muted-foreground/50 rounded-md border border-border/30 p-3 text-center">
                💡 Salve o serviço primeiro para adicionar arquivos.
              </p>
            )}

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
