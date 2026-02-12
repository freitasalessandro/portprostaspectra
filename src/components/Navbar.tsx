import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X, Sun, Moon } from "lucide-react";
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
  const [isDark, setIsDark] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    setIsDark(!isDark);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-2xl bg-background/80 border-b border-border/30 shadow-lg"
          : "backdrop-blur-none bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + Brand */}
        <a href="#" className="flex items-center gap-3 group">
          <motion.div
            className="w-9 h-7 relative flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
          >
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse-glow" />
            <img
              src={spectraLogo}
              alt="Spectra"
              className="w-9 h-7 relative z-10 transition-all duration-300"
              style={{ filter: "brightness(0) saturate(100%) invert(35%) sepia(98%) saturate(2000%) hue-rotate(210deg) brightness(100%)" }}
            />
          </motion.div>
          <span className="font-display text-xl font-extrabold tracking-tight">
            <span className="text-foreground">SPECTR</span>
            <span className="text-primary">A</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <img
            src={spectraLogo}
            alt=""
            className="w-6 h-5 opacity-40"
            style={{ filter: "brightness(0) saturate(100%) invert(35%) sepia(98%) saturate(2000%) hue-rotate(210deg) brightness(100%)" }}
          />
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

          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-300"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </motion.button>

          <motion.a
            href="#contato"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="font-display text-xs font-bold uppercase tracking-widest px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 relative overflow-hidden group glow-box"
          >
            <span className="relative z-10">Diagnóstico</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
          </motion.a>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center text-muted-foreground"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </motion.button>
          <button
            onClick={() => setOpen(!open)}
            className="text-foreground"
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
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
            className="font-body text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest text-left"
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
