import { motion, AnimatePresence } from "framer-motion";
import { FileText, ListChecks, ClipboardList, Brain, PenTool, Code2, Palette, Share2, Globe, Megaphone } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import forms1 from "@/assets/cases/forms-1.png";
import forms2 from "@/assets/cases/forms-2.png";
import forms3 from "@/assets/cases/forms-3.png";
import forms4 from "@/assets/cases/forms-4.png";
import flowlist1 from "@/assets/cases/flowlist-1.png";
import flowlist2 from "@/assets/cases/flowlist-2.png";
import flowlist4 from "@/assets/cases/flowlist-4.png";
import flowlist5 from "@/assets/cases/flowlist-5.png";
import flowlist6 from "@/assets/cases/flowlist-6.png";
import contrato1 from "@/assets/cases/contrato-1.png";
import contrato2 from "@/assets/cases/contrato-2.png";
import contrato3 from "@/assets/cases/contrato-3.png";
import contrato4 from "@/assets/cases/contrato-4.png";
import contrato5 from "@/assets/cases/contrato-5.png";

import CaseCard from "./cases/CaseCard";

export type CaseItem = {
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
  metric: string;
  metricLabel: string;
  screenshots: string[];
  comingSoon?: boolean;
  link?: string;
};

const iconMap: Record<string, React.ElementType> = {
  FileText, ListChecks, ClipboardList, Brain, PenTool, Code2,
  Palette, Share2, Globe, Megaphone,
};

// Fallback static screenshots (used when no DB files exist)
const staticScreenshotMap: Record<string, string[]> = {
  "Contrato Online + Boleto Fácil": [contrato1, contrato2, contrato3, contrato4, contrato5],
  "FlowList": [flowlist1, flowlist2, flowlist4, flowlist5, flowlist6],
  "Forms": [forms1, forms2, forms3, forms4],
};

const metricMap: Record<string, { metric: string; metricLabel: string }> = {
  "Contrato Online + Boleto Fácil": { metric: "3x", metricLabel: "conversão" },
  "FlowList": { metric: "360°", metricLabel: "visão total" },
  "Forms": { metric: "10x", metricLabel: "mais dados" },
  "Spectra Sign": { metric: "🛠️", metricLabel: "em dev" },
  "Calculadora de Linfedema": { metric: "99%", metricLabel: "precisão" },
  "AVA": { metric: "🛠️", metricLabel: "em dev" },
};

interface DbService {
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

interface DbFile {
  service_id: string;
  file_path: string;
  file_type: string;
  sort_order: number;
}

const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from("service-files").getPublicUrl(path);
  return data.publicUrl;
};

const toCaseItem = (s: DbService, dbFiles: DbFile[]): CaseItem => {
  const uploadedImages = dbFiles
    .filter(f => f.service_id === s.id && f.file_type === "image")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(f => getPublicUrl(f.file_path));

  return {
    title: s.title,
    category: s.category,
    description: s.description,
    icon: iconMap[s.icon] || FileText,
    metric: metricMap[s.title]?.metric || "—",
    metricLabel: metricMap[s.title]?.metricLabel || "",
    screenshots: uploadedImages.length > 0 ? uploadedImages : (staticScreenshotMap[s.title] || []),
    comingSoon: s.status === "development",
    link: s.link || undefined,
  };
};

const CasesSection = () => {
  const [activeScreenshot, setActiveScreenshot] = useState<Record<string, number>>({});
  const [saasProducts, setSaasProducts] = useState<CaseItem[]>([]);
  const [customDev, setCustomDev] = useState<CaseItem[]>([]);
  const [designServices, setDesignServices] = useState<CaseItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [servicesRes, filesRes] = await Promise.all([
        supabase.from("services").select("*").eq("is_case", true).order("sort_order"),
        supabase.from("service_files").select("*").order("sort_order"),
      ]);

      const services = (servicesRes.data as DbService[]) || [];
      const files = (filesRes.data as DbFile[]) || [];

      setSaasProducts(services.filter(s => s.section === "saas").map(s => toCaseItem(s, files)));
      setCustomDev(services.filter(s => s.section === "custom").map(s => toCaseItem(s, files)));
      setDesignServices(services.filter(s => s.section === "design").map(s => toCaseItem(s, files)));
      setLoaded(true);
    };
    fetchAll();
  }, []);

  if (!loaded) return null;

  return (
    <section className="py-28 md:py-36 px-6 md:px-12 relative overflow-hidden" id="cases">
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

      <motion.div
        className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-primary/4 blur-[180px] rounded-full pointer-events-none"
        animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* SaaS Products */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-primary tracking-[0.4em] uppercase text-xs md:text-sm mb-4 font-body flex items-center gap-3">
            <motion.span
              className="w-10 h-px bg-primary/50"
              initial={{ width: 0 }}
              whileInView={{ width: 40 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
            Cases
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">
            Resultados<br />
            <span className="font-extralight text-foreground/60">que falam sozinhos.</span>
          </h2>
        </motion.div>

        <div className="space-y-3 mb-24">
          {saasProducts.map((item, i) => (
            <CaseCard
              key={item.title}
              item={item}
              index={i}
              activeScreenshot={activeScreenshot}
              setActiveScreenshot={setActiveScreenshot}
            />
          ))}
        </div>

        {/* Custom Development */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-primary tracking-[0.4em] uppercase text-xs md:text-sm mb-4 font-body flex items-center gap-3">
            <motion.span
              className="w-10 h-px bg-primary/50"
              initial={{ width: 0 }}
              whileInView={{ width: 40 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
            Sob Demanda
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight leading-[0.95]">
            Desenvolvimento<br />
            <span className="font-extralight text-foreground/60">sob medida.</span>
          </h2>
          <p className="text-muted-foreground/60 font-body text-sm mt-4 max-w-xl">
            Projetos exclusivos desenvolvidos para resolver desafios específicos de cada cliente, com tecnologia de ponta e entrega personalizada.
          </p>
        </motion.div>

        <div className="space-y-3 mb-24">
          {customDev.map((item, i) => (
            <CaseCard
              key={item.title}
              item={item}
              index={i}
              indexKey={`custom-${i}`}
              activeScreenshot={activeScreenshot}
              setActiveScreenshot={setActiveScreenshot}
            />
          ))}
        </div>

        {/* Design Services */}
        {designServices.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="mb-16"
            >
              <p className="text-primary tracking-[0.4em] uppercase text-xs md:text-sm mb-4 font-body flex items-center gap-3">
                <motion.span
                  className="w-10 h-px bg-primary/50"
                  initial={{ width: 0 }}
                  whileInView={{ width: 40 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                />
                Inteligência em Design
              </p>
              <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight leading-[0.95]">
                Marca que<br />
                <span className="font-extralight text-foreground/60">domina.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {designServices.map((service, i) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                  className="group border border-border/30 rounded-2xl p-6 hover:border-primary/40 transition-all duration-500 bg-card/10 hover:bg-card/30 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/40 to-transparent transition-all duration-500" />
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(220_100%_55%/0.2)] transition-all duration-300">
                    <service.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">
                    {service.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CasesSection;
