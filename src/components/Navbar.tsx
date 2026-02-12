import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import spectraLogo from "@/assets/spectra-logo.svg";

const navLinks = [
  { label: "Serviços", href: "#servicos" },
  { label: "Cases", href: "#arsenal" },
  { label: "Contato", href: "#contato" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/30"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + Brand */}
        <a href="#" className="flex items-center gap-3 group">
          <img
            src={spectraLogo}
            alt="Spectra"
            className="w-8 h-6 transition-all duration-300"
            style={{ filter: "drop-shadow(0 0 8px hsl(82 85% 50% / 0.3))" }}
          />
          <span className="font-display text-xl font-extrabold tracking-tight">
            SPECTR<span className="text-primary">A</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-body text-sm text-muted-foreground hover:text-primary transition-colors duration-300 uppercase tracking-widest"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contato"
            className="font-display text-xs font-bold uppercase tracking-widest px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
          >
            Diagnóstico
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-foreground"
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl px-6 py-6 flex flex-col gap-4"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-body text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contato"
            onClick={() => setOpen(false)}
            className="font-display text-xs font-bold uppercase tracking-widest px-5 py-2.5 bg-primary text-primary-foreground text-center mt-2"
          >
            Diagnóstico
          </a>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
