import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/features/admin/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";
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
import { Switch } from "@/components/ui/switch";
import {
  FileText, ListChecks, ClipboardList, Brain, PenTool, Code2,
  Palette, Share2, Globe, Megaphone, ExternalLink, Pencil, Trash2,
  Upload, X, Image, Film, FileIcon, Save, Type,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  FileText, ListChecks, ClipboardList, Brain, PenTool, Code2,
  Palette, Share2, Globe, Megaphone,
};
const iconOptions = Object.keys(iconMap);

const defaultHeaders: Record<string, { label: string; title_bold: string; title_light: string; subtitle: string }> = {
  saas: { label: "Cases", title_bold: "Resultados", title_light: "que falam sozinhos.", subtitle: "" },
  custom: { label: "Sob Demanda", title_bold: "Desenvolvimento", title_light: "sob medida.", subtitle: "Projetos exclusivos desenvolvidos para resolver desafios específicos de cada cliente, com tecnologia de ponta e entrega personalizada." },
  design: { label: "Inteligência em Design", title_bold: "Marca que", title_light: "domina.", subtitle: "" },
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

interface SectionHeader {
  id?: string;
  section_key: string;
  label: string;
  title_bold: string;
  title_light: string;
  subtitle: string;
}

interface Category {
  id: string;
  name: string;
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

const AdminCases = () => {
  const [cases, setCases] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceFiles, setServiceFiles] = useState<Record<string, ServiceFile[]>>({});
  const [headers, setHeaders] = useState<Record<string, SectionHeader>>({});
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [headerDialogOpen, setHeaderDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Service | null>(null);
  const [editingHeader, setEditingHeader] = useState<SectionHeader | null>(null);
  const [editFiles, setEditFiles] = useState<ServiceFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "", category: "", description: "", icon: "FileText",
    status: "production", link: "", metric: "", metric_label: "",
  });
  const [headerForm, setHeaderForm] = useState({ label: "", title_bold: "", title_light: "", subtitle: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      fetchAll();
    };
    check();
  }, [navigate]);

  const fetchAll = async () => {
    const [casesRes, filesRes, headersRes, catsRes] = await Promise.all([
      supabase.from("services").select("*").eq("is_case", true).order("section").order("sort_order"),
      supabase.from("service_files").select("*").order("sort_order"),
      supabase.from("portfolio_sections").select("*"),
      supabase.from("service_categories").select("*").eq("active", true).order("sort_order"),
    ]);

    if (!casesRes.error) setCases((casesRes.data as Service[]) || []);
    if (!catsRes.error) setCategories((catsRes.data as Category[]) || []);

    if (!filesRes.error) {
      const grouped: Record<string, ServiceFile[]> = {};
      (filesRes.data as ServiceFile[])?.forEach(f => {
        if (!grouped[f.service_id]) grouped[f.service_id] = [];
        grouped[f.service_id].push(f);
      });
      setServiceFiles(grouped);
    }

    if (!headersRes.error) {
      const map: Record<string, SectionHeader> = {};
      (headersRes.data as any[])?.forEach(h => {
        map[h.section_key] = h;
      });
      // Merge with defaults
      for (const key of ["saas", "custom", "design"]) {
        if (!map[key]) map[key] = { section_key: key, ...defaultHeaders[key] };
      }
      setHeaders(map);
    }

    setLoading(false);
  };

  // ── Header editing ──
  const openHeaderEdit = (sectionKey: string) => {
    const h = headers[sectionKey] || { section_key: sectionKey, ...defaultHeaders[sectionKey] };
    setEditingHeader(h);
    setHeaderForm({ label: h.label, title_bold: h.title_bold, title_light: h.title_light, subtitle: h.subtitle });
    setHeaderDialogOpen(true);
  };

  const saveHeader = async () => {
    if (!editingHeader) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload = {
      section_key: editingHeader.section_key,
      label: headerForm.label,
      title_bold: headerForm.title_bold,
      title_light: headerForm.title_light,
      subtitle: headerForm.subtitle,
      user_id: session.user.id,
    };

    if (editingHeader.id) {
      const { error } = await supabase.from("portfolio_sections").update(payload).eq("id", editingHeader.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("portfolio_sections").insert(payload);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    }

    toast({ title: "Seção atualizada" });
    setHeaderDialogOpen(false);
    fetchAll();
  };

  // ── Case editing ──
  const openCaseEdit = (s: Service) => {
    setEditingCase(s);
    setForm({
      title: s.title,
      category: s.category,
      description: s.description,
      icon: s.icon,
      status: s.status,
      link: s.link || "",
      metric: s.metric || "",
      metric_label: s.metric_label || "",
    });
    setEditFiles(serviceFiles[s.id] || []);
    setEditDialogOpen(true);
  };

  const saveCase = async () => {
    if (!editingCase) return;
    const payload = {
      title: form.title,
      category: form.category,
      description: form.description,
      icon: form.icon,
      status: form.status,
      link: form.link || null,
      metric: form.metric || null,
      metric_label: form.metric_label || null,
    };

    const { error } = await supabase.from("services").update(payload).eq("id", editingCase.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Case atualizado" });
    setEditDialogOpen(false);
    fetchAll();
  };

  // ── File management ──
  const processFiles = async (files: File[]) => {
    if (!editingCase || !files.length) return;
    setUploading(true);

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${editingCase.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("service-files").upload(path, file);
      if (uploadError) {
        toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
        continue;
      }

      const { error: dbError } = await supabase.from("service_files").insert({
        service_id: editingCase.id,
        file_path: path,
        file_type: getFileType(file.name),
        sort_order: editFiles.length,
      });
      if (dbError) toast({ title: "Erro", description: dbError.message, variant: "destructive" });
    }

    const { data } = await supabase.from("service_files").select("*").eq("service_id", editingCase.id).order("sort_order");
    setEditFiles((data as ServiceFile[]) || []);
    setUploading(false);
    fetchAll();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    processFiles(Array.from(e.target.files));
  };

  const handleFileDelete = async (file: ServiceFile) => {
    await supabase.storage.from("service-files").remove([file.file_path]);
    await supabase.from("service_files").delete().eq("id", file.id);
    setEditFiles(prev => prev.filter(f => f.id !== file.id));
    fetchAll();
    toast({ title: "Foto removida" });
  };

  const grouped = ["saas", "custom", "design"]
    .map(section => ({
      section,
      header: headers[section] || { section_key: section, ...defaultHeaders[section] },
      items: cases.filter(s => s.section === section),
    }))
    .filter(g => g.items.length > 0);

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
            <span className="w-6 h-px bg-primary/40" />
            Portfólio
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Cases</h1>
          <p className="text-sm text-muted-foreground/70 mt-2 font-body">
            Edite textos das seções, detalhes dos cases e gerencie as fotos exibidas no portfólio.
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Carregando...</div>
        ) : cases.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground mb-2">Nenhum serviço marcado como case.</p>
            <p className="text-xs text-muted-foreground/60">Marque serviços como "Case" no módulo de Serviços.</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.section} className="mb-12">
              {/* Section header with edit button */}
              <div className="flex items-start justify-between gap-4 mb-6 p-4 border border-dashed border-border/40 rounded-lg bg-card/20">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-primary/60 mb-1">{group.header.label}</p>
                  <h2 className="font-display text-xl font-bold leading-tight">
                    {group.header.title_bold}{" "}
                    <span className="font-extralight text-foreground/60">{group.header.title_light}</span>
                  </h2>
                  {group.header.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{group.header.subtitle}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => openHeaderEdit(group.section)} className="shrink-0 gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  Editar textos
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{group.items.length} case{group.items.length !== 1 ? "s" : ""}</p>

              <motion.div className="grid gap-3" variants={staggerContainer} initial="hidden" animate="visible">
                {group.items.map(s => {
                  const Icon = iconMap[s.icon] || FileText;
                  const st = statusConfig[s.status] || statusConfig.production;
                  const files = serviceFiles[s.id] || [];
                  return (
                    <motion.div key={s.id} variants={fadeUp} className="glass-card-premium p-5 flex items-start gap-4 group hover:border-primary/30 transition-all duration-500 relative overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-display font-bold text-base truncate">{s.title}</h3>
                          <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-bold ${st.color}`}>
                            {st.label}
                          </span>
                          {files.length > 0 && (
                            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-bold bg-muted text-muted-foreground flex items-center gap-1">
                              <Image className="w-3 h-3" /> {files.length} foto{files.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] uppercase tracking-widest text-primary/60 mb-1">{s.category}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{s.description}</p>
                        {s.metric && (
                          <p className="text-xs text-primary mt-1">Métrica: <strong>{s.metric}</strong> {s.metric_label}</p>
                        )}
                        {/* Thumbnail strip */}
                        {files.length > 0 && (
                          <div className="flex gap-1.5 mt-2 overflow-x-auto">
                            {files.slice(0, 6).map(f => (
                              <div key={f.id} className="w-14 h-9 rounded border border-border/30 overflow-hidden shrink-0 bg-card/50">
                                {f.file_type === "image" ? (
                                  <img src={getPublicUrl(f.file_path)} alt="" className="w-full h-full object-cover" />
                                ) : f.file_type === "video" ? (
                                  <div className="w-full h-full flex items-center justify-center"><Film className="w-3 h-3 text-muted-foreground" /></div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><FileIcon className="w-3 h-3 text-muted-foreground" /></div>
                                )}
                              </div>
                            ))}
                            {files.length > 6 && <span className="text-[10px] text-muted-foreground self-center">+{files.length - 6}</span>}
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
                        <Button variant="ghost" size="icon" onClick={() => openCaseEdit(s)} className="w-8 h-8">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          ))
        )}
      </div>

      {/* ── Header edit dialog ── */}
      <Dialog open={headerDialogOpen} onOpenChange={setHeaderDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Editar Seção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Label (tag superior)</label>
              <Input value={headerForm.label} onChange={e => setHeaderForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex: Cases" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Título (negrito)</label>
              <Input value={headerForm.title_bold} onChange={e => setHeaderForm(f => ({ ...f, title_bold: e.target.value }))} placeholder="Ex: Resultados" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Título (leve)</label>
              <Input value={headerForm.title_light} onChange={e => setHeaderForm(f => ({ ...f, title_light: e.target.value }))} placeholder="Ex: que falam sozinhos." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Subtítulo (opcional)</label>
              <Textarea value={headerForm.subtitle} onChange={e => setHeaderForm(f => ({ ...f, subtitle: e.target.value }))} rows={2} placeholder="Texto descritivo abaixo do título..." />
            </div>
            {/* Preview */}
            <div className="p-4 border border-border/30 rounded-lg bg-card/30">
              <p className="text-[10px] uppercase tracking-widest text-primary/60 mb-1">Preview</p>
              <p className="text-primary tracking-[0.4em] uppercase text-xs mb-2">{headerForm.label}</p>
              <h3 className="font-display text-2xl font-black tracking-tight leading-tight">
                {headerForm.title_bold}<br />
                <span className="font-extralight text-foreground/80">{headerForm.title_light}</span>
              </h3>
              {headerForm.subtitle && <p className="text-sm text-muted-foreground mt-2">{headerForm.subtitle}</p>}
            </div>
            <Button onClick={saveHeader} className="w-full gap-2">
              <Save className="w-4 h-4" /> Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Case edit dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Editar Case</DialogTitle>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Ícone</label>
                <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(name => {
                      const Ic = iconMap[name];
                      return (
                        <SelectItem key={name} value={name}>
                          <span className="flex items-center gap-2"><Ic className="w-4 h-4" /> {name}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Em produção</SelectItem>
                    <SelectItem value="development">Em desenvolvimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Link externo</label>
              <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Métrica</label>
                <Input value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))} placeholder="Ex: 3x" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Label da métrica</label>
                <Input value={form.metric_label} onChange={e => setForm(f => ({ ...f, metric_label: e.target.value }))} placeholder="Ex: conversão" />
              </div>
            </div>

            {/* ── File management ── */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Fotos / Screenshots</label>
              {editFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {editFiles.map(f => (
                    <div key={f.id} className="relative group/file rounded border border-border/30 overflow-hidden aspect-video bg-card/50">
                      {f.file_type === "image" ? (
                        <img src={getPublicUrl(f.file_path)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {f.file_type === "video" ? <Film className="w-5 h-5 text-muted-foreground" /> : <FileIcon className="w-5 h-5 text-muted-foreground" />}
                        </div>
                      )}
                      <button
                        onClick={() => handleFileDelete(f)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Enviando..." : "Adicionar fotos"}
              </Button>
            </div>

            <Button onClick={saveCase} className="w-full gap-2">
              <Save className="w-4 h-4" /> Salvar case
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCases;
