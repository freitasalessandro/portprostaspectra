import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import { useModuleAccess, type ModuleKey } from "@/hooks/useModuleAccess";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: ModuleKey;
  requiredAction?: "can_view" | "can_create" | "can_edit" | "can_delete";
}

const TIMEOUT_MS = 10000;

const ProtectedRoute = ({ children, requiredModule, requiredAction = "can_view" }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { permissions, loading, initialized, isAdmin, userId, refreshPermissions } = useModuleAccess();
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const isLoading = !initialized || loading;

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleRetry = async () => {
    setRetrying(true);
    setTimedOut(false);
    try {
      await refreshPermissions();
    } finally {
      setRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary/40 mx-auto" />
          {timedOut && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <p className="text-muted-foreground text-sm">O carregamento está demorando mais que o esperado.</p>
              <Button variant="outline" size="sm" onClick={handleRetry} disabled={retrying} className="gap-2">
                <RefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  if (!requiredModule || isAdmin) return <>{children}</>;

  const perm = permissions[requiredModule];
  if (!perm || !perm[requiredAction]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground text-sm">Você não tem permissão para acessar este módulo.</p>
          <button onClick={() => navigate("/admin")} className="text-primary text-sm underline">
            Voltar ao painel
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
