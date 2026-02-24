import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import PageTransition from "@/components/PageTransition";
import PageSkeleton from "@/components/PageSkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useNavigationTelemetry } from "@/hooks/useNavigationTelemetry";
import { useRuntimeGuards } from "@/hooks/useRuntimeGuards";
import ProtectedRoute from "@/components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminCases = lazy(() => import("./pages/AdminCases"));
const AdminServicos = lazy(() => import("./pages/AdminServicos"));
const AdminCategorias = lazy(() => import("./pages/AdminCategorias"));
const AdminUsuarios = lazy(() => import("./pages/AdminUsuarios"));
const AdminConfiguracoes = lazy(() => import("./pages/AdminConfiguracoes"));
const AdminPagamentos = lazy(() => import("./pages/AdminPagamentos"));
const AdminIntegracoes = lazy(() => import("./pages/AdminIntegracoes"));
const AdminAuditoria = lazy(() => import("./pages/AdminAuditoria"));
const AdminDiagnostico = lazy(() => import("./pages/AdminDiagnostico"));
const AdminComunicacoesModelos = lazy(() => import("./pages/AdminComunicacoesModelos"));
const AdminComunicacoesGatilhos = lazy(() => import("./pages/AdminComunicacoesGatilhos"));
const AdminComunicacoesHistorico = lazy(() => import("./pages/AdminComunicacoesHistorico"));
const AdminContratos = lazy(() => import("./pages/AdminContratos"));
const AdminContratosConfig = lazy(() => import("./pages/AdminContratosConfig"));
const ContractEditor = lazy(() => import("./pages/ContractEditor"));
const ContractView = lazy(() => import("./pages/ContractView"));
const ProposalEditor = lazy(() => import("./pages/ProposalEditor"));
const ProposalView = lazy(() => import("./pages/ProposalView"));
const Atendimento = lazy(() => import("./pages/Atendimento"));
const AtendimentoDashboard = lazy(() => import("./pages/AtendimentoDashboard"));
const AtendimentoConfiguracoes = lazy(() => import("./pages/AtendimentoConfiguracoes"));
const AtendimentoContatos = lazy(() => import("./pages/AtendimentoContatos"));
const MeuPerfil = lazy(() => import("./pages/MeuPerfil"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageSkeleton />}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  </ErrorBoundary>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  useNavigationTelemetry();
  useRuntimeGuards();

  useEffect(() => {
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    requestAnimationFrame(() => {
      document.querySelectorAll("main").forEach((element) => {
        if (element instanceof HTMLElement) {
          element.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
      });
    });
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LazyPage><Index /></LazyPage>} />
        <Route path="/login" element={<LazyPage><Login /></LazyPage>} />
        <Route path="/admin" element={<LazyPage><ProtectedRoute module="propostas"><Admin /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/cases" element={<LazyPage><ProtectedRoute module="servicos"><AdminCases /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/servicos" element={<LazyPage><ProtectedRoute module="servicos"><AdminServicos /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/categorias" element={<LazyPage><ProtectedRoute module="servicos"><AdminCategorias /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/usuarios" element={<LazyPage><ProtectedRoute module="usuarios"><AdminUsuarios /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/configuracoes" element={<LazyPage><ProtectedRoute module="configuracoes"><AdminConfiguracoes /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/pagamentos" element={<LazyPage><ProtectedRoute module="pagamentos"><AdminPagamentos /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/integracoes" element={<LazyPage><ProtectedRoute module="integracoes"><AdminIntegracoes /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/auditoria" element={<LazyPage><ProtectedRoute module="auditoria"><AdminAuditoria /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/diagnostico" element={<LazyPage><ProtectedRoute module="configuracoes"><AdminDiagnostico /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/comunicacoes/modelos" element={<LazyPage><ProtectedRoute module="comunicacoes"><AdminComunicacoesModelos /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/comunicacoes/gatilhos" element={<LazyPage><ProtectedRoute module="comunicacoes"><AdminComunicacoesGatilhos /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/comunicacoes/historico" element={<LazyPage><ProtectedRoute module="comunicacoes"><AdminComunicacoesHistorico /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/contratos" element={<LazyPage><ProtectedRoute module="contratos"><AdminContratos /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/contratos/configuracoes" element={<LazyPage><ProtectedRoute module="contratos"><AdminContratosConfig /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/contratos/:id" element={<LazyPage><ProtectedRoute module="contratos" action="can_edit"><ContractEditor /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/proposta/:id" element={<LazyPage><ProtectedRoute module="propostas" action="can_edit"><ProposalEditor /></ProtectedRoute></LazyPage>} />
        <Route path="/proposta/:id" element={<LazyPage><ProposalView /></LazyPage>} />
        <Route path="/p/:id" element={<LazyPage><ProposalView /></LazyPage>} />
        <Route path="/contrato/:id" element={<LazyPage><ContractView /></LazyPage>} />
        <Route path="/atendimento" element={<LazyPage><ProtectedRoute module="atendimento"><Atendimento /></ProtectedRoute></LazyPage>} />
        <Route path="/atendimento/dashboard" element={<LazyPage><ProtectedRoute module="atendimento"><AtendimentoDashboard /></ProtectedRoute></LazyPage>} />
        <Route path="/atendimento/configuracoes" element={<LazyPage><ProtectedRoute module="atendimento" action="can_edit"><AtendimentoConfiguracoes /></ProtectedRoute></LazyPage>} />
        <Route path="/atendimento/contatos" element={<LazyPage><ProtectedRoute module="atendimento"><AtendimentoContatos /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/perfil" element={<LazyPage><MeuPerfil /></LazyPage>} />
        <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
