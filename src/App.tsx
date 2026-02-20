import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import PageTransition from "@/components/PageTransition";
import PageSkeleton from "@/components/PageSkeleton";

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
        <Route path="/admin" element={<LazyPage><Admin /></LazyPage>} />
        <Route path="/admin/cases" element={<LazyPage><AdminCases /></LazyPage>} />
        <Route path="/admin/servicos" element={<LazyPage><AdminServicos /></LazyPage>} />
        <Route path="/admin/categorias" element={<LazyPage><AdminCategorias /></LazyPage>} />
        <Route path="/admin/usuarios" element={<LazyPage><AdminUsuarios /></LazyPage>} />
        <Route path="/admin/configuracoes" element={<LazyPage><AdminConfiguracoes /></LazyPage>} />
        <Route path="/admin/pagamentos" element={<LazyPage><AdminPagamentos /></LazyPage>} />
        <Route path="/admin/integracoes" element={<LazyPage><AdminIntegracoes /></LazyPage>} />
        <Route path="/admin/auditoria" element={<LazyPage><AdminAuditoria /></LazyPage>} />
        <Route path="/admin/comunicacoes/modelos" element={<LazyPage><AdminComunicacoesModelos /></LazyPage>} />
        <Route path="/admin/comunicacoes/gatilhos" element={<LazyPage><AdminComunicacoesGatilhos /></LazyPage>} />
        <Route path="/admin/comunicacoes/historico" element={<LazyPage><AdminComunicacoesHistorico /></LazyPage>} />
        <Route path="/admin/contratos" element={<LazyPage><AdminContratos /></LazyPage>} />
        <Route path="/admin/contratos/configuracoes" element={<LazyPage><AdminContratosConfig /></LazyPage>} />
        <Route path="/admin/contratos/:id" element={<LazyPage><ContractEditor /></LazyPage>} />
        <Route path="/admin/proposta/:id" element={<LazyPage><ProposalEditor /></LazyPage>} />
        <Route path="/proposta/:id" element={<LazyPage><ProposalView /></LazyPage>} />
        <Route path="/p/:id" element={<LazyPage><ProposalView /></LazyPage>} />
        <Route path="/contrato/:id" element={<LazyPage><ContractView /></LazyPage>} />
        <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
