import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Power, PowerOff } from "lucide-react";

interface Category {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
  user_id: string;
}

const AdminCategorias = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      fetchCategories();
    };
    check();
  }, [navigate]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("service_categories")
      .select("*")
      .order("sort_order");
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setCategories((data as Category[]) || []);
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setName(c.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (editingId) {
      const { error } = await supabase.from("service_categories").update({ name }).eq("id", editingId);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Categoria atualizada" });
    } else {
      const { error } = await supabase.from("service_categories").insert({
        name,
        sort_order: categories.length,
        user_id: session.user.id,
      });
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Categoria criada" });
    }
    setDialogOpen(false);
    fetchCategories();
  };

  const toggleActive = async (c: Category) => {
    const { error } = await supabase
      .from("service_categories")
      .update({ active: !c.active })
      .eq("id", c.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: c.active ? "Categoria inativada" : "Categoria ativada" });
    fetchCategories();
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <motion.div className="flex items-center justify-between mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div>
            <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1.5 font-body flex items-center gap-2">
              <span className="w-6 h-px bg-primary/40" />
              Organização
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Categorias</h1>
          </div>
          <Button onClick={openNew} className="font-display uppercase tracking-[0.2em] text-[10px] py-5 px-6 relative overflow-hidden group glow-box">
            <span className="relative z-10 flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Categoria</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </Button>
        </motion.div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Carregando...</div>
        ) : categories.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma categoria criada.</p>
            <Button onClick={openNew} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Criar primeira categoria
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            {categories.map(c => (
              <div
                key={c.id}
                className={`glass-card p-4 flex items-center justify-between gap-4 transition-opacity ${!c.active ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${c.active ? "bg-green-400" : "bg-muted-foreground/30"}`} />
                  <span className="font-display font-bold text-sm truncate">{c.name}</span>
                  {!c.active && (
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-bold bg-muted text-muted-foreground shrink-0">
                      Inativa
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="w-8 h-8">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActive(c)}
                    className={`w-8 h-8 ${c.active ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground hover:text-green-400"}`}
                    title={c.active ? "Inativar" : "Ativar"}
                  >
                    {c.active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Nome</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: SaaS · Fintech" />
            </div>
            <Button onClick={handleSave} className="w-full font-display uppercase tracking-widest text-xs" disabled={!name.trim()}>
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategorias;
