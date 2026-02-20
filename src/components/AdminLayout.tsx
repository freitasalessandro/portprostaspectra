import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Briefcase, Wrench, Users, Settings, LogOut, Menu, X, Tag, CreditCard, Plug, ScrollText } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import spectraLogo from "@/assets/spectra-logo.svg";

const menuItems = [
  { title: "Propostas", icon: FileText, path: "/admin" },
  { title: "Cases", icon: Briefcase, path: "/admin/cases" },
  { title: "Serviços", icon: Wrench, path: "/admin/servicos" },
  { title: "Categorias", icon: Tag, path: "/admin/categorias" },
  { title: "Pagamentos", icon: CreditCard, path: "/admin/pagamentos" },
  { title: "Usuários", icon: Users, path: "/admin/usuarios" },
  { title: "Integrações", icon: Plug, path: "/admin/integracoes" },
  { title: "Auditoria", icon: ScrollText, path: "/admin/auditoria" },
  { title: "Configurações", icon: Settings, path: "/admin/configuracoes" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-[240px] bg-sidebar/80 backdrop-blur-2xl border-r border-sidebar-border/50
          flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.25,0.4,0.25,1)]
          md:translate-x-0 md:static
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern opacity-[0.04] pointer-events-none" />

        {/* Subtle glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border/30 shrink-0 relative">
          <img
            src={spectraLogo}
            alt="Spectra"
            className="w-6 h-4"
            style={{ filter: "drop-shadow(0 0 10px hsl(220 100% 55% / 0.3))" }}
          />
          <span className="font-display text-sm font-extrabold tracking-tight text-sidebar-foreground uppercase">
            Spectr<span className="text-primary">a</span>
          </span>
          <button
            className="ml-auto md:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto relative z-10">
          {menuItems.map((item, i) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className="flex items-center gap-3 px-4 py-2.5 rounded-md text-[13px] font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200 group relative"
              activeClassName="!text-primary bg-primary/10 !font-semibold"
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="w-4 h-4 shrink-0 group-hover:text-primary transition-colors duration-200" strokeWidth={1.5} />
              <span className="tracking-wide">{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 shrink-0 relative z-10">
          <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/30 to-transparent mb-4" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-md text-[13px] font-medium text-sidebar-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full group"
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:text-destructive transition-colors" strokeWidth={1.5} />
            <span className="tracking-wide">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <header className="h-14 flex items-center px-5 border-b border-border/20 bg-background/80 backdrop-blur-2xl md:hidden sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-foreground/60 hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 ml-4">
            <img src={spectraLogo} alt="Spectra" className="w-5 h-3.5" />
            <span className="font-display text-sm font-extrabold tracking-tight uppercase">
              Spectr<span className="text-primary">a</span>
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
          {/* Background effects */}
          <div className="absolute inset-0 grid-pattern opacity-[0.03] pointer-events-none" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/3 blur-[200px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
