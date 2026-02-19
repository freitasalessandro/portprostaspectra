import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Briefcase, Wrench, Users, Settings, LogOut, Menu, X, Tag } from "lucide-react";
import { useState } from "react";
import spectraLogo from "@/assets/spectra-logo.svg";

const menuItems = [
  { title: "Propostas", icon: FileText, path: "/admin" },
  { title: "Cases", icon: Briefcase, path: "/admin/cases" },
  { title: "Serviços", icon: Wrench, path: "/admin/servicos" },
  { title: "Categorias", icon: Tag, path: "/admin/categorias" },
  { title: "Usuários", icon: Users, path: "/admin/usuarios" },
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
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-[220px] bg-sidebar border-r border-sidebar-border
          flex flex-col transition-transform duration-200
          md:translate-x-0 md:static
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border shrink-0">
          <img src={spectraLogo} alt="Spectra" className="w-6 h-4" />
          <span className="font-display text-sm font-extrabold tracking-tight text-sidebar-foreground uppercase">
            Spectra
          </span>
          <button
            className="ml-auto md:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              activeClassName="!text-sidebar-primary bg-sidebar-accent !font-semibold"
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <header className="h-14 flex items-center px-4 border-b border-border/30 bg-card/60 backdrop-blur-xl md:hidden sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <img src={spectraLogo} alt="Spectra" className="w-5 h-3.5" />
            <span className="font-display text-sm font-extrabold tracking-tight uppercase">Spectra</span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
