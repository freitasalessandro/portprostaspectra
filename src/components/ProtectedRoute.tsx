import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import PageSkeleton from "@/components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldAlert, Clock } from "lucide-react";

interface Props {
  module: string;
  action?: "can_view" | "can_create" | "can_edit" | "can_delete";
  children: React.ReactNode;
}

const TIMEOUT_MS = 10000;

export default function ProtectedRoute({ module, action = "can_view", children }: Props) {
  const { hasAccess, isLoading, userId } = useModuleAccess();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }

    const id = window.setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [isLoading]);

  if (isLoading && timedOut) return <TimeoutIndicator />;
  if (isLoading) return <PageSkeleton />;
  if (!userId) return <Navigate to="/login" replace />;
  if (!hasAccess(module, action)) return <AccessDenied />;

  return <>{children}</>;
}

function TimeoutIndicator() {
  const handleRetry = () => window.location.reload();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-destructive/70 animate-pulse" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">Carregamento lento</h2>
        <p className="text-sm text-muted-foreground">
          As permissões estão demorando mais que o esperado para carregar. Isso pode ser causado por uma conexão lenta ou instabilidade no servidor.
        </p>
        <Button onClick={handleRetry} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3 max-w-md px-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="font-display text-xl font-bold">Acesso negado</h2>
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para acessar este módulo. Solicite acesso ao administrador.
        </p>
      </div>
    </div>
  );
}
