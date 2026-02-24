import { Navigate } from "react-router-dom";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import PageSkeleton from "@/components/PageSkeleton";

interface Props {
  module: string;
  action?: "can_view" | "can_create" | "can_edit" | "can_delete";
  children: React.ReactNode;
}

export default function ProtectedRoute({ module, action = "can_view", children }: Props) {
  const { hasAccess, isLoading, userId } = useModuleAccess();

  if (isLoading) return <PageSkeleton />;
  if (!userId) return <Navigate to="/login" replace />;
  if (!hasAccess(module, action)) return <AccessDenied />;

  return <>{children}</>;
}

function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3 max-w-md px-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold">Acesso negado</h2>
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para acessar este módulo. Solicite acesso ao administrador.
        </p>
      </div>
    </div>
  );
}
