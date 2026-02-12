import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import spectraLogo from "@/assets/spectra-logo.svg";

const navLinks = [
  { label: "Arsenal", href: "#arsenal" },
  { label: "Cases", href: "#cases" },
  { label: "Contato", href: "#contato" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-2xl bg-background/80 border-b border-border/30 shadow-[0_4px_30px_hsl(220_20%_4%/0.5)]"
          : "backdrop-blur-none bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + Brand */}
        <a href="#" className="flex items-center gap-3 group">
          <motion.img
            src={spectraLogo}
            alt="Spectra"
            className="w-8 h-6 transition-all duration-300 group-hover:scale-110"
            style={{ filter: "drop-shadow(0 0 8px hsl(220 100% 55% / 0.3))" }}
            whileHover={{ filter: "drop-shadow(0 0 16px hsl(220 100% 55% / 0.6))" }}
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
              className="font-body text-sm text-muted-foreground hover:text-primary transition-colors duration-300 uppercase tracking-widest relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <button
            onClick={() => navigate("/login")}
            className="font-body text-sm text-muted-foreground hover:text-primary transition-colors duration-300 uppercase tracking-widest relative group"
          >
            Admin
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
          </button>
          <motion.a
            href="#contato"
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px hsl(220 100% 55% / 0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="font-display text-xs font-bold uppercase tracking-widest px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 relative overflow-hidden group"
          >
            <span className="relative z-10">Diagnóstico</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
          </motion.a>
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
          <button
            onClick={() => { navigate("/login"); setOpen(false); }}
            className="font-body text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
          >
            Admin
          </button>
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
