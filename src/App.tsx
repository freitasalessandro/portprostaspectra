import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import PageTransition from "@/shared/components/PageTransition";
import ErrorBoundary from "@/shared/components/ErrorBoundary";
import PageSkeleton from "@/shared/components/PageSkeleton";
import { ModuleAccessProvider } from "@/hooks/useModuleAccess";
import { useErrorTelemetry } from "@/hooks/useErrorTelemetry";

/* ─── Public (Portfolio) ─── */
const Index = lazy(() => import("@/features/portfolio/pages/Index"));

/* ─── Auth ─── */
const Login = lazy(() => import("@/features/auth/pages/Login"));

/* ─── Public views (proposals/contracts) ─── */
const ProposalView = lazy(() => import("@/features/propostas/pages/ProposalView"));
const ContractView = lazy(() => import("@/features/contratos/pages/ContractView"));
const NotFound = lazy(() => import("@/shared/pages/NotFound"));

/* ─── Private (lazy-loaded as a group via PrivateRoutes barrel) ─── */
const lazyPrivate = (getter: () => Promise<{ default: React.ComponentType<any> }>) => lazy(getter);
const Admin = lazyPrivate(() => import("@/features/admin/pages/Admin"));
const AdminCases = lazyPrivate(() => import("@/features/admin/pages/AdminCases"));
const AdminServicos = lazyPrivate(() => import("@/features/admin/pages/AdminServicos"));
const AdminCategorias = lazyPrivate(() => import("@/features/admin/pages/AdminCategorias"));
const AdminUsuarios = lazyPrivate(() => import("@/features/admin/pages/AdminUsuarios"));
const AdminConfiguracoes = lazyPrivate(() => import("@/features/admin/pages/AdminConfiguracoes"));
const AdminPagamentos = lazyPrivate(() => import("@/features/admin/pages/AdminPagamentos"));
const AdminIntegracoes = lazyPrivate(() => import("@/features/admin/pages/AdminIntegracoes"));
const AdminAuditoria = lazyPrivate(() => import("@/features/admin/pages/AdminAuditoria"));
const AdminComunicacoesModelos = lazyPrivate(() => import("@/features/admin/pages/AdminComunicacoesModelos"));
const AdminComunicacoesGatilhos = lazyPrivate(() => import("@/features/admin/pages/AdminComunicacoesGatilhos"));
const AdminComunicacoesHistorico = lazyPrivate(() => import("@/features/admin/pages/AdminComunicacoesHistorico"));
const AdminContratos = lazyPrivate(() => import("@/features/contratos/pages/AdminContratos"));
const AdminContratosConfig = lazyPrivate(() => import("@/features/contratos/pages/AdminContratosConfig"));
const ContractEditor = lazyPrivate(() => import("@/features/contratos/pages/ContractEditor"));
const ProposalEditor = lazyPrivate(() => import("@/features/propostas/pages/ProposalEditor"));
const Atendimento = lazyPrivate(() => import("@/features/atendimento/pages/Atendimento"));
const AtendimentoDashboard = lazyPrivate(() => import("@/features/atendimento/pages/AtendimentoDashboard"));
const AtendimentoConfiguracoes = lazyPrivate(() => import("@/features/atendimento/pages/AtendimentoConfiguracoes"));
const AtendimentoContatos = lazyPrivate(() => import("@/features/atendimento/pages/AtendimentoContatos"));
const MeuPerfil = lazyPrivate(() => import("@/features/admin/pages/MeuPerfil"));
const AdminDiagnostico = lazyPrivate(() => import("@/features/admin/pages/AdminDiagnostico"));
const AdminErrorLogs = lazyPrivate(() => import("@/features/admin/pages/AdminErrorLogs"));

/* ─── Auth guard ─── */
const ProtectedRoute = lazy(() => import("@/features/auth/components/ProtectedRoute"));

const queryClient = new QueryClient();

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageSkeleton />}>
    <PageTransition>{children}</PageTransition>
  </Suspense>
);

const TelemetryProvider = () => {
  useErrorTelemetry();
  return null;
};

const AnimatedRoutes = () => {
  return (
    <>
      <TelemetryProvider />
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<LazyPage><Index /></LazyPage>} />
        <Route path="/login" element={<LazyPage><Login /></LazyPage>} />
        <Route path="/proposta/:id" element={<LazyPage><ProposalView /></LazyPage>} />
        <Route path="/p/:id" element={<LazyPage><ProposalView /></LazyPage>} />
        <Route path="/contrato/:id" element={<LazyPage><ContractView /></LazyPage>} />

        {/* ── Private routes (admin) ── */}
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
        <Route path="/admin/perfil" element={<LazyPage><ProtectedRoute><MeuPerfil /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/diagnostico" element={<LazyPage><ProtectedRoute><AdminDiagnostico /></ProtectedRoute></LazyPage>} />
        <Route path="/admin/error-logs" element={<LazyPage><ProtectedRoute><AdminErrorLogs /></ProtectedRoute></LazyPage>} />

        {/* ── Private routes (atendimento) ── */}
        <Route path="/atendimento" element={<LazyPage><ProtectedRoute requiredModule="atendimento"><Atendimento /></ProtectedRoute></LazyPage>} />
        <Route path="/atendimento/dashboard" element={<LazyPage><ProtectedRoute requiredModule="atendimento"><AtendimentoDashboard /></ProtectedRoute></LazyPage>} />
        <Route path="/atendimento/configuracoes" element={<LazyPage><ProtectedRoute requiredModule="atendimento"><AtendimentoConfiguracoes /></ProtectedRoute></LazyPage>} />
        <Route path="/atendimento/contatos" element={<LazyPage><ProtectedRoute requiredModule="atendimento"><AtendimentoContatos /></ProtectedRoute></LazyPage>} />

        {/* ── Fallback ── */}
        <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
      </Routes>
    </>
  );
};

const App = () => {

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <div className="min-h-screen">
          <QueryClientProvider client={queryClient}>
            <ModuleAccessProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AnimatedRoutes />
                </BrowserRouter>
              </TooltipProvider>
            </ModuleAccessProvider>
          </QueryClientProvider>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
