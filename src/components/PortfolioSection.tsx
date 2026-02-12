import { motion } from "framer-motion";
import { ArrowUpRight, FileText, ListChecks, ClipboardList, Brain, Palette, Share2, Globe, Megaphone } from "lucide-react";

const products = [
  {
    title: "Contrato Online + Boleto Fácil",
    category: "Domínio Financeiro",
    description: "Vendas automatizadas, gestão de contratos e dinheiro no caixa sem fricção.",
    icon: FileText,
  },
  {
    title: "FlowList",
    category: "Controle Total",
    description: "Gestão 360° de projetos e margem financeira. O fim do 'acho que estamos lucrando'.",
    icon: ListChecks,
  },
  {
    title: "Forms",
    category: "Inteligência Pura",
    description: "Captura de dados que gera insight estratégico, não apenas lista.",
    icon: ClipboardList,
  },
  {
    title: "Calculadora de Linfedema",
    category: "IA de Elite",
    description: "IA para diagnósticos médicos de alta precisão em hospitais de referência.",
    icon: Brain,
  },
];

const designServices = [
  {
    title: "Identidade Visual",
    description: "Logos, paletas, tipografia e brandbook completo para posicionar sua marca.",
    icon: Palette,
  },
  {
    title: "Social Media & Gestão",
    description: "Criação de conteúdo, calendário editorial e gerenciamento de redes sociais.",
    icon: Share2,
  },
  {
    title: "Construção de Sites",
    description: "Landing pages, portais e plataformas web com design premium e alta conversão.",
    icon: Globe,
  },
  {
    title: "Tráfego Pago",
    description: "Campanhas estratégicas para garantir que sua tecnologia domine o mercado.",
    icon: Megaphone,
  },
];

const PortfolioSection = () => {
  return (
    <section className="py-32 px-6" id="arsenal">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-4 font-body">O Arsenal Spectra</p>
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            Produtos que geram
            <br />
            <span className="text-gradient">resultado.</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-6 font-body max-w-xl">
            Ferramentas próprias criadas para quem não tem tempo a perder.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-24">
          {products.map((product, i) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative border border-border/50 rounded-2xl p-8 hover:border-primary/50 transition-all duration-500 bg-card/20 hover:bg-card/50 cursor-pointer overflow-hidden"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                    <product.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center group-hover:border-primary group-hover:bg-primary transition-all duration-300">
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                </div>

                <span className="text-xs text-primary tracking-[0.2em] uppercase font-body">{product.category}</span>
                <h3 className="font-display text-xl md:text-2xl font-bold mt-2 mb-3 group-hover:text-primary transition-colors duration-300">
                  {product.title}
                </h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Design & Branding Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-4 font-body">Inteligência em Design</p>
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            Marca que
            <br />
            <span className="text-gradient">domina.</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-6 font-body max-w-xl">
            Design, branding e tráfego integrados para que sua tecnologia não seja apenas funcional, mas dominante.
          </p>
        </motion.div>

        {/* Design Services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {designServices.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group border border-border/30 rounded-2xl p-6 hover:border-primary/40 transition-all duration-500 bg-card/10 hover:bg-card/30 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors duration-300">
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
      </div>
    </section>
  );
};

export default PortfolioSection;
