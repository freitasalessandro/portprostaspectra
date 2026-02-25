import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useModuleAccess, type ModuleKey } from "@/hooks/useModuleAccess";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: ModuleKey;
  requiredAction?: "can_view" | "can_create" | "can_edit" | "can_delete";
}

const ProtectedRoute = ({ children, requiredModule, requiredAction = "can_view" }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { permissions, loading, isAdmin, userId } = useModuleAccess();

  console.log("[ProtectedRoute] state:", { loading, userId, isAdmin, requiredModule, requiredAction });

  // Still loading auth + permissions
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

  // Not authenticated
  if (!userId) {
    navigate("/login", { replace: true });
    return null;
  }

  // No module required — just auth is enough
  if (!requiredModule) return <>{children}</>;

  // Admins always pass
  if (isAdmin) return <>{children}</>;

  // Check granular permission
  const perm = permissions[requiredModule];
  if (!perm || !perm[requiredAction]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground text-sm">Você não tem permissão para acessar este módulo.</p>
          <button
            onClick={() => navigate("/admin")}
            className="text-primary text-sm underline"
          >
            Voltar ao painel
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
