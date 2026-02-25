import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import PageTransition from "@/components/PageTransition";
import PageSkeleton from "@/components/PageSkeleton";
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
  <Suspense fallback={<PageSkeleton />}>
    <PageTransition>{children}</PageTransition>
  </Suspense>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LazyPage><Index /></LazyPage>} />
        <Route path="/login" element={<LazyPage><Login /></LazyPage>} />
        <Route path="/admin" element={<LazyPage><ProtectedRoute><Admin /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/cases" element={<LazyPage><ProtectedRoute requiredModule="catalogo"><AdminCases /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/servicos" element={<LazyPage><ProtectedRoute requiredModule="catalogo"><AdminServicos /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/categorias" element={<LazyPage><ProtectedRoute requiredModule="catalogo"><AdminCategorias /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/usuarios" element={<LazyPage><ProtectedRoute requiredModule="usuarios"><AdminUsuarios /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/configuracoes" element={<LazyPage><ProtectedRoute requiredModule="configuracoes"><AdminConfiguracoes /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/pagamentos" element={<LazyPage><ProtectedRoute requiredModule="pagamentos"><AdminPagamentos /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/integracoes" element={<LazyPage><ProtectedRoute requiredModule="integracoes"><AdminIntegracoes /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/auditoria" element={<LazyPage><ProtectedRoute requiredModule="auditoria"><AdminAuditoria /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/comunicacoes/modelos" element={<LazyPage><ProtectedRoute requiredModule="comunicacoes"><AdminComunicacoesModelos /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/comunicacoes/gatilhos" element={<LazyPage><ProtectedRoute requiredModule="comunicacoes"><AdminComunicacoesGatilhos /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/comunicacoes/historico" element={<LazyPage><ProtectedRoute requiredModule="comunicacoes"><AdminComunicacoesHistorico /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/contratos" element={<LazyPage><ProtectedRoute requiredModule="contratos"><AdminContratos /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/contratos/configuracoes" element={<LazyPage><ProtectedRoute requiredModule="contratos"><AdminContratosConfig /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/contratos/:id" element={<LazyPage><ProtectedRoute requiredModule="contratos"><ContractEditor /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/proposta/:id" element={<LazyPage><ProtectedRoute requiredModule="propostas"><ProposalEditor /></ProtectedRoute></LazyPage>} />
        <Route path="/proposta/:id" element={<LazyPage><ProposalView /></LazyPage>} />
        <Route path="/p/:id" element={<LazyPage><ProposalView /></LazyPage>} />
        <Route path="/contrato/:id" element={<LazyPage><ContractView /></LazyPage>} />
        <Route path="/atendimento" element={<LazyPage><ProtectedRoute requiredModule="atendimento"><Atendimento /></ProtectedRoute></LazyPage>} />
        <Route path="/atendimento/dashboard" element={<LazyPage><ProtectedRoute requiredModule="atendimento"><AtendimentoDashboard /></ProtectedRoute></LazyPage>} />
        <Route path="/atendimento/configuracoes" element={<LazyPage><ProtectedRoute requiredModule="atendimento"><AtendimentoConfiguracoes /></ProtectedRoute></LazyPage>} />
        <Route path="/atendimento/contatos" element={<LazyPage><ProtectedRoute requiredModule="atendimento"><AtendimentoContatos /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/perfil" element={<LazyPage><ProtectedRoute><MeuPerfil /></ProtectedRoute></LazyPage>} />
        <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
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
);

export default App;
