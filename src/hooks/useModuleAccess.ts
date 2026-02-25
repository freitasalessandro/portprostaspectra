import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ModuleKey =
  | "propostas"
  | "contratos"
  | "atendimento"
  | "catalogo"
  | "comunicacoes"
  | "pagamentos"
  | "usuarios"
  | "integracoes"
  | "auditoria"
  | "configuracoes";

export type ModulePermission = {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

const FULL_ACCESS: ModulePermission = { can_view: true, can_create: true, can_edit: true, can_delete: true };
const NO_ACCESS: ModulePermission = { can_view: false, can_create: false, can_edit: false, can_delete: false };

type PermissionsMap = Record<ModuleKey, ModulePermission>;

const DEFAULT_MAP: PermissionsMap = {
  propostas: NO_ACCESS, contratos: NO_ACCESS, atendimento: NO_ACCESS,
  catalogo: NO_ACCESS, comunicacoes: NO_ACCESS, pagamentos: NO_ACCESS,
  usuarios: NO_ACCESS, integracoes: NO_ACCESS, auditoria: NO_ACCESS,
  configuracoes: NO_ACCESS,
};

export function useModuleAccess() {
  const [permissions, setPermissions] = useState<PermissionsMap>(DEFAULT_MAP);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchPermissions = useCallback(async (uid: string) => {
    try {
      console.log("[useModuleAccess] fetchPermissions for uid:", uid);
      // Check admin role first
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .maybeSingle();
      console.log("[useModuleAccess] roleData:", roleData, "roleError:", roleError);

      if (roleData?.role === "admin") {
        setIsAdmin(true);
        // Admins get full access to everything
        const fullMap = { ...DEFAULT_MAP };
        (Object.keys(fullMap) as ModuleKey[]).forEach(k => { fullMap[k] = FULL_ACCESS; });
        setPermissions(fullMap);
        setLoading(false);
        return;
      }

      setIsAdmin(false);

      // Fetch granular permissions
      const { data, error } = await supabase
        .from("user_module_access")
        .select("module, can_view, can_create, can_edit, can_delete")
        .eq("user_id", uid);

      if (error) {
        console.error("Error fetching module access:", error);
        setLoading(false);
        return;
      }

      const map = { ...DEFAULT_MAP };
      (data || []).forEach((row: any) => {
        const key = row.module as ModuleKey;
        if (key in map) {
          map[key] = {
            can_view: row.can_view ?? false,
            can_create: row.can_create ?? false,
            can_edit: row.can_edit ?? false,
            can_delete: row.can_delete ?? false,
          };
        }
      });

      setPermissions(map);
    } catch (err) {
      console.error("useModuleAccess error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled && loading) {
        console.warn("useModuleAccess: timeout reached, releasing UI");
        setLoading(false);
      }
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user) {
        setUserId(session.user.id);
        fetchPermissions(session.user.id);
      } else {
        setUserId(null);
        setPermissions(DEFAULT_MAP);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // Also check current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        setUserId(session.user.id);
        fetchPermissions(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchPermissions]);

  const canView = useCallback((mod: ModuleKey) => permissions[mod]?.can_view ?? false, [permissions]);
  const canCreate = useCallback((mod: ModuleKey) => permissions[mod]?.can_create ?? false, [permissions]);
  const canEdit = useCallback((mod: ModuleKey) => permissions[mod]?.can_edit ?? false, [permissions]);
  const canDelete = useCallback((mod: ModuleKey) => permissions[mod]?.can_delete ?? false, [permissions]);

  return { permissions, isAdmin, loading, userId, canView, canCreate, canEdit, canDelete };
}
