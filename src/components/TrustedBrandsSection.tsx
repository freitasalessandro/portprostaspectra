import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";

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
    <section className="py-10 md:py-28 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

      <motion.div
        className="max-w-7xl mx-auto relative z-10 px-5 md:px-12"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div className="text-center mb-10 md:mb-16" variants={fadeUp}>
          <p className="text-primary tracking-[0.4em] uppercase text-xs md:text-sm mb-3 md:mb-4 font-body flex items-center justify-center gap-3">
            <motion.span
              className="w-8 md:w-10 h-px bg-primary/50"
              initial={{ width: 0 }}
              whileInView={{ width: 40 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
            Confiança
            <motion.span
              className="w-8 md:w-10 h-px bg-primary/50"
              initial={{ width: 0 }}
              whileInView={{ width: 40 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
          </p>
          <h2 className="font-display text-xl sm:text-2xl md:text-5xl font-black tracking-tight leading-[0.95]">
            Marcas que<br />
            <span className="font-extralight text-foreground/60">confiam na gente.</span>
          </h2>
        </motion.div>
      </motion.div>

      {/* Marquee infinite scroll */}
      <motion.div
        className="relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="flex overflow-hidden">
          <motion.div
            className="flex shrink-0 gap-8 md:gap-16 items-center py-6 md:py-8"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...brands, ...brands].map((brand, i) => (
              <div
                key={`${brand.name}-${i}`}
                className="shrink-0 flex items-center justify-center h-12 md:h-20 w-28 md:w-44 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default TrustedBrandsSection;
