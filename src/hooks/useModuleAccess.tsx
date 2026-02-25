import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
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

type PermissionsMap = Record<ModuleKey, ModulePermission>;

const MODULE_KEYS: ModuleKey[] = [
  "propostas",
  "contratos",
  "atendimento",
  "catalogo",
  "comunicacoes",
  "pagamentos",
  "usuarios",
  "integracoes",
  "auditoria",
  "configuracoes",
];

const FULL_ACCESS: ModulePermission = { can_view: true, can_create: true, can_edit: true, can_delete: true };
const NO_ACCESS: ModulePermission = { can_view: false, can_create: false, can_edit: false, can_delete: false };

const createNoAccessMap = (): PermissionsMap =>
  MODULE_KEYS.reduce((acc, key) => {
    acc[key] = { ...NO_ACCESS };
    return acc;
  }, {} as PermissionsMap);

const createFullAccessMap = (): PermissionsMap =>
  MODULE_KEYS.reduce((acc, key) => {
    acc[key] = { ...FULL_ACCESS };
    return acc;
  }, {} as PermissionsMap);

interface ModuleAccessContextValue {
  permissions: PermissionsMap;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
  userId: string | null;
  canView: (mod: ModuleKey) => boolean;
  canCreate: (mod: ModuleKey) => boolean;
  canEdit: (mod: ModuleKey) => boolean;
  canDelete: (mod: ModuleKey) => boolean;
  refreshPermissions: () => Promise<void>;
}

const ModuleAccessContext = createContext<ModuleAccessContextValue | null>(null);

export function ModuleAccessProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<PermissionsMap>(() => createNoAccessMap());
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const applyIfCurrent = useCallback((requestId: number, apply: () => void) => {
    if (!mountedRef.current) return;
    if (requestId !== requestIdRef.current) return;
    apply();
  }, []);

  const resetAccess = useCallback((markInitialized = true) => {
    requestIdRef.current += 1;
    setUserId(null);
    setPermissions(createNoAccessMap());
    setIsAdmin(false);
    setLoading(false);
    if (markInitialized) setInitialized(true);
  }, []);

  const fetchPermissions = useCallback(async (uid: string) => {
    const requestId = ++requestIdRef.current;
    applyIfCurrent(requestId, () => setLoading(true));

    try {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);

      if (rolesError) throw rolesError;

      const userIsAdmin = (roles ?? []).some((row) => row.role === "admin");
      if (userIsAdmin) {
        applyIfCurrent(requestId, () => {
          setIsAdmin(true);
          setPermissions(createFullAccessMap());
          setLoading(false);
        });
        return;
      }

      const { data: rows, error: accessError } = await supabase
        .from("user_module_access")
        .select("module, can_view, can_create, can_edit, can_delete")
        .eq("user_id", uid);

      if (accessError) throw accessError;

      const map = createNoAccessMap();
      for (const row of rows ?? []) {
        const key = row.module as ModuleKey;
        if (!MODULE_KEYS.includes(key)) continue;
        map[key] = {
          can_view: row.can_view ?? false,
          can_create: row.can_create ?? false,
          can_edit: row.can_edit ?? false,
          can_delete: row.can_delete ?? false,
        };
      }

      applyIfCurrent(requestId, () => {
        setIsAdmin(false);
        setPermissions(map);
        setLoading(false);
      });
    } catch (error) {
      console.error("[ModuleAccessProvider] Failed to fetch permissions:", error);
      applyIfCurrent(requestId, () => {
        setIsAdmin(false);
        setPermissions(createNoAccessMap());
        setLoading(false);
      });
    }
  }, [applyIfCurrent]);

  const syncSession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      resetAccess(true);
      return;
    }

    setUserId(session.user.id);
    setInitialized(true);
    await fetchPermissions(session.user.id);
  }, [fetchPermissions, resetAccess]);

  useEffect(() => {
    mountedRef.current = true;

    const hardStop = setTimeout(() => {
      if (!mountedRef.current) return;
      setInitialized(true);
      setLoading(false);
    }, 12000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSession(session);
    });

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      clearTimeout(hardStop);
      subscription.unsubscribe();
    };
  }, [syncSession]);

  const refreshPermissions = useCallback(async () => {
    if (!userId) return;
    await fetchPermissions(userId);
  }, [fetchPermissions, userId]);

  const canView = useCallback((mod: ModuleKey) => permissions[mod]?.can_view ?? false, [permissions]);
  const canCreate = useCallback((mod: ModuleKey) => permissions[mod]?.can_create ?? false, [permissions]);
  const canEdit = useCallback((mod: ModuleKey) => permissions[mod]?.can_edit ?? false, [permissions]);
  const canDelete = useCallback((mod: ModuleKey) => permissions[mod]?.can_delete ?? false, [permissions]);

  const value = useMemo<ModuleAccessContextValue>(() => ({
    permissions,
    isAdmin,
    loading,
    initialized,
    userId,
    canView,
    canCreate,
    canEdit,
    canDelete,
    refreshPermissions,
  }), [permissions, isAdmin, loading, initialized, userId, canView, canCreate, canEdit, canDelete, refreshPermissions]);

  return <ModuleAccessContext.Provider value={value}>{children}</ModuleAccessContext.Provider>;
}

export function useModuleAccess() {
  const context = useContext(ModuleAccessContext);
  if (!context) {
    throw new Error("useModuleAccess must be used within ModuleAccessProvider");
  }
  return context;
}

