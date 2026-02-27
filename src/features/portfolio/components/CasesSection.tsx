import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { FileText, ListChecks, ClipboardList, Brain, PenTool, Code2, Palette, Share2, Globe, Megaphone } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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

import CaseCard from "./CaseCard";

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
  metric: string | null;
  metric_label: string | null;
}

interface DbFile {
  service_id: string;
  file_path: string;
  file_type: string;
  sort_order: number;
}

interface DbSectionHeader {
  section_key: string;
  label: string;
  title_bold: string;
  title_light: string;
  subtitle: string;
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
    metric: s.metric || metricMap[s.title]?.metric || "—",
    metricLabel: s.metric_label || metricMap[s.title]?.metricLabel || "",
    screenshots: uploadedImages.length > 0 ? uploadedImages : (staticScreenshotMap[s.title] || []),
    comingSoon: s.status === "development",
    link: s.link || undefined,
  };
};

const defaultHeaders: Record<string, { label: string; title_bold: string; title_light: string; subtitle: string }> = {
  saas: { label: "Cases", title_bold: "Resultados", title_light: "que falam sozinhos.", subtitle: "" },
  custom: { label: "Sob Demanda", title_bold: "Desenvolvimento", title_light: "sob medida.", subtitle: "Projetos exclusivos desenvolvidos para resolver desafios específicos de cada cliente, com tecnologia de ponta e entrega personalizada." },
  design: { label: "Inteligência em Design", title_bold: "Marca que", title_light: "domina.", subtitle: "" },
};

const CasesSection = () => {
  const [activeScreenshot, setActiveScreenshot] = useState<Record<string, number>>({});
  const [saasProducts, setSaasProducts] = useState<CaseItem[]>([]);
  const [customDev, setCustomDev] = useState<CaseItem[]>([]);
  const [designServices, setDesignServices] = useState<CaseItem[]>([]);
  const [sectionHeaders, setSectionHeaders] = useState(defaultHeaders);
  const [loaded, setLoaded] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgParallax = useTransform(scrollYProgress, [0, 1], [0, -80]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [servicesRes, filesRes, headersRes] = await Promise.all([
          supabase.from("services").select("*").eq("is_case", true).order("sort_order"),
          supabase.from("service_files").select("*").order("sort_order"),
          supabase.from("portfolio_sections").select("*"),
        ]);

        if (servicesRes.error) throw servicesRes.error;
        if (filesRes.error) throw filesRes.error;

        const services = (servicesRes.data as DbService[]) || [];
        const files = (filesRes.data as DbFile[]) || [];

        setSaasProducts(services.filter(s => s.section === "saas").map(s => toCaseItem(s, files)));
        setCustomDev(services.filter(s => s.section === "custom").map(s => toCaseItem(s, files)));
        setDesignServices(services.filter(s => s.section === "design").map(s => toCaseItem(s, files)));

        // Merge DB headers with defaults
        if (!headersRes.error && headersRes.data) {
          const merged = { ...defaultHeaders };
          (headersRes.data as DbSectionHeader[]).forEach(h => {
            merged[h.section_key] = {
              label: h.label || defaultHeaders[h.section_key]?.label || "",
              title_bold: h.title_bold || defaultHeaders[h.section_key]?.title_bold || "",
              title_light: h.title_light || defaultHeaders[h.section_key]?.title_light || "",
              subtitle: h.subtitle || defaultHeaders[h.section_key]?.subtitle || "",
            };
          });
          setSectionHeaders(merged);
        }
      } catch (error) {
        console.error("[CasesSection] Failed to load cases:", error);
        setSaasProducts([]);
        setCustomDev([]);
        setDesignServices([]);
      } finally {
        setLoaded(true);
      }
    };

    void fetchAll();
  }, []);

  if (!loaded) return null;

  const SectionHeader = ({ label, titleBold, titleLight, subtitle }: { label: string; titleBold: string; titleLight: string; subtitle?: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="mb-10 md:mb-16"
    >
      <p className="text-primary tracking-[0.4em] uppercase text-xs md:text-sm mb-3 md:mb-4 font-body flex items-center gap-3">
        <motion.span
          className="w-8 md:w-10 h-px bg-primary/50"
          initial={{ width: 0 }}
          whileInView={{ width: 40 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
        {label}
      </p>
      <h2 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95]">
        {titleBold}<br />
        <span className="font-extralight text-foreground/80">{titleLight}</span>
      </h2>
      {subtitle && (
        <p className="text-muted-foreground font-body text-sm mt-3 md:mt-4 max-w-xl">
          {subtitle}
        </p>
      )}
    </motion.div>
  );

  return (
    <section ref={sectionRef} className="py-10 md:py-36 px-4 sm:px-5 md:px-12 relative overflow-hidden" id="cases">
      <motion.div className="absolute inset-0 grid-pattern opacity-15" style={{ y: bgParallax }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

      <motion.div
        className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-primary/4 blur-[180px] rounded-full pointer-events-none"
        animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* SaaS Products */}
        <SectionHeader label={sectionHeaders.saas.label} titleBold={sectionHeaders.saas.title_bold} titleLight={sectionHeaders.saas.title_light} subtitle={sectionHeaders.saas.subtitle} />

        <div className="space-y-3 mb-20 md:mb-24">
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
        <SectionHeader
          label={sectionHeaders.custom.label}
          titleBold={sectionHeaders.custom.title_bold}
          titleLight={sectionHeaders.custom.title_light}
          subtitle={sectionHeaders.custom.subtitle}
        />

        <div className="space-y-3 mb-20 md:mb-24">
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
            <SectionHeader label={sectionHeaders.design.label} titleBold={sectionHeaders.design.title_bold} titleLight={sectionHeaders.design.title_light} subtitle={sectionHeaders.design.subtitle} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {designServices.map((service, i) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                  className="group border border-border/30 p-5 md:p-6 hover:border-primary/40 transition-all duration-500 bg-card/10 hover:bg-card/30 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/40 to-transparent transition-all duration-500" />
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 md:mb-5 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(220_100%_55%/0.2)] transition-all duration-300">
                    <service.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-display text-base md:text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-300">
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
