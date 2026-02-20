import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import AdminCases from "./pages/AdminCases";
import AdminServicos from "./pages/AdminServicos";
import AdminCategorias from "./pages/AdminCategorias";
import AdminUsuarios from "./pages/AdminUsuarios";
import AdminConfiguracoes from "./pages/AdminConfiguracoes";
import AdminPagamentos from "./pages/AdminPagamentos";
import AdminIntegracoes from "./pages/AdminIntegracoes";
import AdminAuditoria from "./pages/AdminAuditoria";
import AdminComunicacoesModelos from "./pages/AdminComunicacoesModelos";
import AdminComunicacoesGatilhos from "./pages/AdminComunicacoesGatilhos";
import AdminComunicacoesHistorico from "./pages/AdminComunicacoesHistorico";
import AdminContratos from "./pages/AdminContratos";
import AdminContratosConfig from "./pages/AdminContratosConfig";
import ContractEditor from "./pages/ContractEditor";
import ContractView from "./pages/ContractView";
import ProposalEditor from "./pages/ProposalEditor";
import ProposalView from "./pages/ProposalView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
        <Route path="/admin/cases" element={<PageTransition><AdminCases /></PageTransition>} />
        <Route path="/admin/servicos" element={<PageTransition><AdminServicos /></PageTransition>} />
        <Route path="/admin/categorias" element={<PageTransition><AdminCategorias /></PageTransition>} />
        <Route path="/admin/usuarios" element={<PageTransition><AdminUsuarios /></PageTransition>} />
        <Route path="/admin/configuracoes" element={<PageTransition><AdminConfiguracoes /></PageTransition>} />
        <Route path="/admin/pagamentos" element={<PageTransition><AdminPagamentos /></PageTransition>} />
        <Route path="/admin/integracoes" element={<PageTransition><AdminIntegracoes /></PageTransition>} />
        <Route path="/admin/auditoria" element={<PageTransition><AdminAuditoria /></PageTransition>} />
        <Route path="/admin/comunicacoes/modelos" element={<PageTransition><AdminComunicacoesModelos /></PageTransition>} />
        <Route path="/admin/comunicacoes/gatilhos" element={<PageTransition><AdminComunicacoesGatilhos /></PageTransition>} />
        <Route path="/admin/comunicacoes/historico" element={<PageTransition><AdminComunicacoesHistorico /></PageTransition>} />
        <Route path="/admin/contratos" element={<PageTransition><AdminContratos /></PageTransition>} />
        <Route path="/admin/contratos/configuracoes" element={<PageTransition><AdminContratosConfig /></PageTransition>} />
        <Route path="/admin/contratos/:id" element={<PageTransition><ContractEditor /></PageTransition>} />
        <Route path="/admin/proposta/:id" element={<PageTransition><ProposalEditor /></PageTransition>} />
        <Route path="/proposta/:id" element={<PageTransition><ProposalView /></PageTransition>} />
        <Route path="/p/:id" element={<PageTransition><ProposalView /></PageTransition>} />
        <Route path="/contrato/:id" element={<PageTransition><ContractView /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
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
