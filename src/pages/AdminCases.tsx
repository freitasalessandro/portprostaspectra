import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  FileText, ListChecks, ClipboardList, Brain, PenTool, Code2,
  Palette, Share2, Globe, Megaphone, ExternalLink,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  FileText, ListChecks, ClipboardList, Brain, PenTool, Code2,
  Palette, Share2, Globe, Megaphone,
};

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
}

const AdminCases = () => {
  const [cases, setCases] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      fetchCases();
    };
    check();
  }, [navigate]);

  const fetchCases = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_case", true)
      .order("section")
      .order("sort_order");
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setCases((data as Service[]) || []);
    }
    setLoading(false);
  };

  const grouped = ["saas", "custom", "design"]
    .map(section => ({
      section,
      label: sectionLabels[section],
      items: cases.filter(s => s.section === section),
    }))
    .filter(g => g.items.length > 0);

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold">Cases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Serviços marcados como case. Para alterar, edite o serviço em <button onClick={() => navigate("/admin/servicos")} className="text-primary hover:underline">Serviços</button>.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Carregando...</div>
        ) : cases.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground mb-2">Nenhum serviço marcado como case.</p>
            <p className="text-xs text-muted-foreground/60">Marque serviços como "Case" no módulo de Serviços para vê-los aqui.</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.section} className="mb-10">
              <h2 className="font-display text-lg font-bold mb-1">{group.label}</h2>
              <p className="text-sm text-muted-foreground mb-4">{group.items.length} case{group.items.length !== 1 ? "s" : ""}</p>
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
                      {s.link && (
                        <a href={s.link} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 w-8 h-8 rounded-md border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCases;
