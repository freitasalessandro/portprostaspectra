import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Briefcase, Wrench, Users, Settings, LogOut, Menu, X, Tag,
  CreditCard, Plug, ScrollText, MessageSquare, FileSignature, ChevronDown,
  LayoutDashboard, Shield, Sun, Moon, MessageCircle, Headphones, Sliders, Contact, UserCircle,
  PanelLeftClose, PanelLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useOpenTicketCount } from "@/hooks/useAtendimento";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import spectraLogo from "@/assets/spectra-logo.svg";

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
  end?: boolean;
}

interface MenuGroup {
  label: string;
  icon: React.ElementType;
  basePaths: string[];
  items: MenuItem[];
}

const standaloneItems: MenuItem[] = [
  { title: "Propostas", icon: FileText, path: "/admin", end: true },
  { title: "Contratos", icon: FileSignature, path: "/admin/contratos" },
];

const menuGroups: MenuGroup[] = [
  {
    label: "Atendimento",
    icon: MessageCircle,
    basePaths: ["/atendimento"],
    items: [
      { title: "Chat", icon: Headphones, path: "/atendimento" },
      { title: "Contatos", icon: Contact, path: "/atendimento/contatos" },
      { title: "Dashboard", icon: LayoutDashboard, path: "/atendimento/dashboard" },
      { title: "Configurações", icon: Sliders, path: "/atendimento/configuracoes" },
    ],
  },
  {
    label: "Catálogo",
    icon: Briefcase,
    basePaths: ["/admin/cases", "/admin/servicos", "/admin/categorias"],
    items: [
      { title: "Cases", icon: Briefcase, path: "/admin/cases" },
      { title: "Serviços", icon: Wrench, path: "/admin/servicos" },
      { title: "Categorias", icon: Tag, path: "/admin/categorias" },
    ],
  },
  {
    label: "Comunicações",
    icon: MessageSquare,
    basePaths: ["/admin/comunicacoes"],
    items: [
      { title: "Gatilhos", icon: MessageSquare, path: "/admin/comunicacoes/gatilhos" },
      { title: "Modelos", icon: FileText, path: "/admin/comunicacoes/modelos" },
      { title: "Histórico", icon: ScrollText, path: "/admin/comunicacoes/historico" },
    ],
  },
  {
    label: "Sistema",
    icon: Settings,
    basePaths: ["/admin/usuarios", "/admin/integracoes", "/admin/auditoria", "/admin/configuracoes", "/admin/pagamentos"],
    items: [
      { title: "Pagamentos", icon: CreditCard, path: "/admin/pagamentos" },
      { title: "Usuários", icon: Users, path: "/admin/usuarios" },
      { title: "Integrações", icon: Plug, path: "/admin/integracoes" },
      { title: "Auditoria", icon: Shield, path: "/admin/auditoria" },
      { title: "Configurações", icon: Settings, path: "/admin/configuracoes" },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

const linkClasses = "flex items-center gap-3 px-4 py-2.5 rounded-md text-[13px] font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200 group relative overflow-hidden";
const activeLinkClasses = "!text-primary bg-primary/10 !font-semibold";
const collapsedLinkClasses = "flex items-center justify-center p-2.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200 group relative";

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const openTicketCount = useOpenTicketCount();

  // Auto-open groups that contain the active route
  const initialOpen = menuGroups
    .filter(g => g.basePaths.some(bp => location.pathname.startsWith(bp)))
    .map(g => g.label);
  const [openGroups, setOpenGroups] = useState<string[]>(initialOpen);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const renderNav = () => {
    if (collapsed) {
      return (
        <>
          {standaloneItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={collapsedLinkClasses}
              activeClassName={activeLinkClasses}
              title={item.title}
            >
              <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            </NavLink>
          ))}
          <div className="h-px bg-sidebar-border/30 my-1" />
          {menuGroups.map((group) => (
            <div key={group.label}>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={collapsedLinkClasses}
                  activeClassName={activeLinkClasses}
                  title={item.title}
                >
                  <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  {item.title === "Chat" && openTicketCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {openTicketCount > 9 ? "9+" : openTicketCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </>
      );
    }

    return (
      <>
        {standaloneItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={linkClasses}
            activeClassName={activeLinkClasses}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="w-4 h-4 shrink-0 group-hover:text-primary transition-colors duration-200" strokeWidth={1.5} />
            <span className="tracking-wide flex-1">{item.title}</span>
          </NavLink>
        ))}

        {menuGroups.map((group) => {
          const isOpen = openGroups.includes(group.label);
          const isGroupActive = group.basePaths.some(bp => location.pathname.startsWith(bp));

          return (
            <div key={group.label} className="pt-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-[13px] font-medium transition-all duration-200 group ${
                  isGroupActive
                    ? "text-primary/80"
                    : "text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                }`}
              >
                <group.icon className="w-4 h-4 shrink-0 transition-colors duration-200" strokeWidth={1.5} />
                <span className="tracking-wide flex-1 text-left">{group.label}</span>
                {group.label === "Atendimento" && openTicketCount > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {openTicketCount > 99 ? "99+" : openTicketCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  strokeWidth={1.5}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pl-3 mt-0.5 space-y-0.5">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={`${linkClasses} text-[12px] py-2`}
                          activeClassName={activeLinkClasses}
                          onClick={() => setMobileOpen(false)}
                        >
                          <item.icon className="w-3.5 h-3.5 shrink-0 group-hover:text-primary transition-colors duration-200" strokeWidth={1.5} />
                          <span className="tracking-wide">{item.title}</span>
                        </NavLink>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </>
    );
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
          fixed top-0 left-0 z-50 h-screen bg-sidebar/80 backdrop-blur-2xl border-r border-sidebar-border/50
          flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.4,0.25,1)]
          md:translate-x-0 md:sticky md:top-0 md:self-start
          ${collapsed ? 'w-[60px]' : 'w-[240px]'}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="absolute inset-0 grid-pattern opacity-[0.04] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

        {/* Logo */}
        <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-6'} border-b border-sidebar-border/30 shrink-0 relative`}>
          <img
            src={spectraLogo}
            alt="Spectra"
            className="w-6 h-4 shrink-0"
            style={{ filter: "drop-shadow(0 0 10px hsl(220 100% 55% / 0.3))" }}
          />
          {!collapsed && (
            <span className="font-display text-sm font-extrabold tracking-tight text-sidebar-foreground uppercase">
              Spectr<span className="text-primary">a</span>
            </span>
          )}
          {!collapsed && (
            <button
              className="ml-auto md:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-5 ${collapsed ? 'px-1.5' : 'px-3'} space-y-0.5 overflow-y-auto relative z-10`}>
          {renderNav()}
        </nav>

        {/* Footer */}
        <div className={`${collapsed ? 'px-1.5' : 'px-3'} pb-5 shrink-0 relative z-10`}>
          <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/30 to-transparent mb-4" />
          {collapsed ? (
            <>
              <NavLink to="/admin/perfil" className={collapsedLinkClasses} activeClassName={activeLinkClasses} title="Meu Perfil">
                <UserCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              </NavLink>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className={collapsedLinkClasses + " w-full"} title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}>
                {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" strokeWidth={1.5} /> : <Moon className="w-4 h-4 shrink-0" strokeWidth={1.5} />}
              </button>
              <button onClick={handleLogout} className={collapsedLinkClasses + " w-full text-sidebar-foreground/30 hover:text-destructive hover:bg-destructive/10"} title="Sair">
                <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <>
              <NavLink to="/admin/perfil" className={linkClasses} activeClassName={activeLinkClasses} onClick={() => setMobileOpen(false)}>
                <UserCircle className="w-4 h-4 shrink-0 group-hover:text-primary transition-colors" strokeWidth={1.5} />
                <span className="tracking-wide">Meu Perfil</span>
              </NavLink>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex items-center gap-3 px-4 py-2.5 rounded-md text-[13px] font-medium text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200 w-full group">
                {theme === "dark" ? <Sun className="w-4 h-4 shrink-0 group-hover:text-primary transition-colors" strokeWidth={1.5} /> : <Moon className="w-4 h-4 shrink-0 group-hover:text-primary transition-colors" strokeWidth={1.5} />}
                <span className="tracking-wide">{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
              </button>
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-md text-[13px] font-medium text-sidebar-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full group">
                <LogOut className="w-4 h-4 shrink-0 group-hover:text-destructive transition-colors" strokeWidth={1.5} />
                <span className="tracking-wide">Sair</span>
              </button>
            </>
          )}
          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-full mt-2 py-2 rounded-md text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all duration-200"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" strokeWidth={1.5} /> : <PanelLeftClose className="w-4 h-4" strokeWidth={1.5} />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
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
          <div className="absolute inset-0 grid-pattern opacity-[0.03] pointer-events-none" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/3 blur-[200px] rounded-full pointer-events-none" />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
