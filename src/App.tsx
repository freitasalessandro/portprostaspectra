import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ContractEditor from "./pages/ContractEditor";
import ContractView from "./pages/ContractView";
import ProposalEditor from "./pages/ProposalEditor";
import ProposalView from "./pages/ProposalView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/cases" element={<AdminCases />} />
          <Route path="/admin/servicos" element={<AdminServicos />} />
          <Route path="/admin/categorias" element={<AdminCategorias />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
          <Route path="/admin/pagamentos" element={<AdminPagamentos />} />
          <Route path="/admin/integracoes" element={<AdminIntegracoes />} />
          <Route path="/admin/auditoria" element={<AdminAuditoria />} />
          <Route path="/admin/comunicacoes/modelos" element={<AdminComunicacoesModelos />} />
          <Route path="/admin/comunicacoes/gatilhos" element={<AdminComunicacoesGatilhos />} />
          <Route path="/admin/comunicacoes/historico" element={<AdminComunicacoesHistorico />} />
          <Route path="/admin/contratos" element={<AdminContratos />} />
          <Route path="/admin/contratos/:id" element={<ContractEditor />} />
          <Route path="/admin/proposta/:id" element={<ProposalEditor />} />
          <Route path="/proposta/:id" element={<ProposalView />} />
          <Route path="/p/:id" element={<ProposalView />} />
          <Route path="/contrato/:id" element={<ContractView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
