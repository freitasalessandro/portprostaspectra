import { motion } from "framer-motion";

import logo2k20 from "@/assets/brands/2k20.png";
import logoConnectg2 from "@/assets/brands/connectg2.png";
import logoHospitalSP from "@/assets/brands/hospital-sao-paulo.png";
import logoInfobr from "@/assets/brands/infobr.png";
import logoHug from "@/assets/brands/hug.png";
import logoPaulista from "@/assets/brands/paulista.png";
import logoJumpNetwork from "@/assets/brands/jump-network.png";
import logoNgt from "@/assets/brands/ngt.png";
import logoTheFiber from "@/assets/brands/the-fiber.png";

const brands = [
  { name: "2K20", logo: logo2k20 },
  { name: "ConnectG2", logo: logoConnectg2 },
  { name: "Hospital São Paulo", logo: logoHospitalSP },
  { name: "InfoBR Telecom", logo: logoInfobr },
  { name: "HUG", logo: logoHug },
  { name: "Prefeitura de Paulista", logo: logoPaulista },
  { name: "Jump Network", logo: logoJumpNetwork },
  { name: "New Group Telecom", logo: logoNgt },
  { name: "The Fiber", logo: logoTheFiber },
];

const TrustedBrandsSection = () => {
  return (
    <section className="py-20 md:py-28 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-primary tracking-[0.4em] uppercase text-xs md:text-sm mb-4 font-body flex items-center justify-center gap-3">
            <motion.span
              className="w-10 h-px bg-primary/50"
              initial={{ width: 0 }}
              whileInView={{ width: 40 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
            Confiança
            <motion.span
              className="w-10 h-px bg-primary/50"
              initial={{ width: 0 }}
              whileInView={{ width: 40 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight leading-[0.95]">
            Marcas que<br />
            <span className="font-extralight text-foreground/60">confiam na gente.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
          {brands.map((brand, i) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group flex items-center justify-center h-28 md:h-32 border border-border/20 hover:border-primary/30 bg-card/10 hover:bg-primary/5 transition-all duration-500 relative overflow-hidden p-6"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-primary/5 to-transparent" />
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-h-16 md:max-h-20 max-w-[80%] object-contain relative z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-500 brightness-0 invert dark:brightness-0 dark:invert group-hover:filter-none group-hover:brightness-100 group-hover:invert-0 dark:group-hover:brightness-100 dark:group-hover:invert-0"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBrandsSection;
