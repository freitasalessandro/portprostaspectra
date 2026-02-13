import { motion, AnimatePresence } from "framer-motion";
import { FileText, ListChecks, ClipboardList, Brain, PenTool, Code2 } from "lucide-react";
import { useState } from "react";

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
};

const saasProducts: CaseItem[] = [
  {
    title: "Contrato Online + Boleto Fácil",
    category: "SaaS · Fintech",
    description: "Plataforma que automatiza vendas, gestão de contratos e cobrança via boleto.",
    icon: FileText,
    metric: "3x",
    metricLabel: "conversão",
    screenshots: [contrato1, contrato2, contrato3, contrato4, contrato5],
  },
  {
    title: "FlowList",
    category: "SaaS · Gestão",
    description: "Gestão 360° com controle de margem financeira em tempo real.",
    icon: ListChecks,
    metric: "360°",
    metricLabel: "visão total",
    screenshots: [flowlist1, flowlist2, flowlist4, flowlist5, flowlist6],
  },
  {
    title: "Forms",
    category: "SaaS · Dados",
    description: "Motor de captura que transforma respostas em insights acionáveis.",
    icon: ClipboardList,
    metric: "10x",
    metricLabel: "mais dados",
    screenshots: [forms1, forms2, forms3, forms4],
  },
  {
    title: "Spectra Sign",
    category: "SaaS · Assinaturas",
    description: "Plataforma de assinatura digital com validade jurídica, integrada ao ecossistema Spectra. Fluxos automatizados de envio, acompanhamento e armazenamento seguro de documentos assinados.",
    icon: PenTool,
    metric: "🛠️",
    metricLabel: "em dev",
    screenshots: [],
    comingSoon: true,
  },
];

const customDev: CaseItem[] = [
  {
    title: "Calculadora de Linfedema",
    category: "HealthTech · IA",
    description: "Sistema de inteligência artificial desenvolvido para hospitais de referência, capaz de calcular volumes e graus de linfedema com precisão clínica. Utiliza modelos de machine learning treinados com dados reais para auxiliar médicos no diagnóstico, acompanhamento e tomada de decisão terapêutica.",
    icon: Brain,
    metric: "99%",
    metricLabel: "precisão",
    screenshots: [],
  },
  {
    title: "AVA",
    category: "EdTech · Plataforma",
    description: "Ambiente virtual de aprendizagem personalizado, desenvolvido sob medida para otimizar a experiência de ensino e gestão educacional.",
    icon: Code2,
    metric: "🛠️",
    metricLabel: "em dev",
    screenshots: [],
    comingSoon: true,
  },
];

const CasesSection = () => {
  const [activeScreenshot, setActiveScreenshot] = useState<Record<string, number>>({});

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
          <p className="text-primary tracking-[0.4em] uppercase text-[10px] md:text-xs mb-4 font-body flex items-center gap-3">
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
          <p className="text-primary tracking-[0.4em] uppercase text-[10px] md:text-xs mb-4 font-body flex items-center gap-3">
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

        <div className="space-y-3">
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
      </div>
    </section>
  );
};

export default CasesSection;
