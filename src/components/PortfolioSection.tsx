import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const products = [
  {
    title: "Contrato Online + Boleto Fácil",
    category: "Domínio Financeiro",
    result: "Vendas automatizadas",
    description: "Dinheiro no caixa com vendas automatizadas e gestão de contratos integrada.",
  },
  {
    title: "FlowList",
    category: "Controle Total",
    result: "Gestão 360°",
    description: "Gestão completa de projetos e margem financeira. O fim do 'acho que estamos lucrando'.",
  },
  {
    title: "Forms",
    category: "Inteligência Pura",
    result: "Dados → Insights",
    description: "Captura de dados que gera insight estratégico, não apenas lista.",
  },
  {
    title: "Calculadora de Linfedema",
    category: "IA de Elite",
    result: "Alta precisão",
    description: "IA para diagnósticos médicos de alta precisão em hospitais de referência.",
  },
];

const PortfolioSection = () => {
  return (
    <section className="py-32 px-6" id="arsenal">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-4 font-body">O Arsenal Spectra</p>
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            SaaS de resposta
            <br />
            <span className="text-gradient">rápida.</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-6 font-body max-w-xl">
            Ferramentas criadas para quem não tem tempo a perder.
          </p>
        </motion.div>

        <div className="space-y-2">
          {products.map((product, i) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group border-b border-border/50 py-8 md:py-10 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 cursor-pointer hover:bg-card/30 transition-all duration-300 px-4 -mx-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-primary tracking-[0.2em] uppercase font-body">{product.category}</span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors duration-300">
                  {product.title}
                </h3>
              </div>

              <p className="text-muted-foreground font-body max-w-xs hidden md:block">
                {product.description}
              </p>

              <div className="flex items-center gap-4">
                <span className="font-display font-bold text-primary text-lg">{product.result}</span>
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary transition-all duration-300">
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
