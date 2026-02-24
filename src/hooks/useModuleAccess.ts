import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

type Permission = {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

type ModuleAccessMap = Record<string, Permission>;
type ModuleAction = keyof Permission;

interface ModuleAccessValue {
  access: ModuleAccessMap;
  isAdmin: boolean;
  isLoading: boolean;
  hasAccess: (module: string, action?: ModuleAction) => boolean;
  userId: string | null;
}

const defaultPerm: Permission = { can_view: false, can_create: false, can_edit: false, can_delete: false };
const QUERY_TIMEOUT_MS = 8000;
const HARD_STOP_MS = 12000;

const ModuleAccessContext = createContext<ModuleAccessValue | null>(null);

async function withTimeout<T>(promiseLike: PromiseLike<T>, label: string): Promise<T> {
  let timeoutId: number | undefined;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`Timeout em ${label}`));
      }, QUERY_TIMEOUT_MS);
    });

    return await Promise.race([Promise.resolve(promiseLike), timeoutPromise]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

function useModuleAccessState(): ModuleAccessValue {
  const [access, setAccess] = useState<ModuleAccessMap>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (session: any) => {
      const hardStopId = window.setTimeout(() => {
        if (!cancelled) {
          console.error("[ModuleAccess] Hard timeout ao carregar permissões");
          setIsLoading(false);
        }
      }, HARD_STOP_MS);

      if (!session || cancelled) {
        window.clearTimeout(hardStopId);
        setUserId(null);
        setIsAdmin(false);
        setAccess({});
        setIsLoading(false);
        return;
      }

      const uid = session.user.id;
      setUserId(uid);
      setIsAdmin(false);
      setAccess({});

      try {
        const roleRequest = supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .eq("role", "admin")
          .maybeSingle();

        const { data: roleData, error: roleError } = await withTimeout(roleRequest, "verificação de perfil admin");

        if (cancelled) return;

        if (roleError) {
          console.error("Error checking admin role:", roleError);
          return;
        }

        if (roleData) {
          setIsAdmin(true);
          return;
        }

        const accessRequest = supabase
          .from("user_module_access")
          .select("module, can_view, can_create, can_edit, can_delete")
          .eq("user_id", uid);

        const { data, error: accessError } = await withTimeout(accessRequest, "carregamento de permissões");

        if (cancelled) return;

        if (accessError) {
          console.error("Error loading module access:", accessError);
          return;
        }

        const map: ModuleAccessMap = {};
        if (data) {
          data.forEach((row) => {
            map[row.module] = {
              can_view: row.can_view,
              can_create: row.can_create,
              can_edit: row.can_edit,
              can_delete: row.can_delete,
            };
          });
        }

        setAccess(map);
      } catch (err) {
        if (!cancelled) {
          console.error("useModuleAccess error:", err);
          setIsAdmin(false);
          setAccess({});
        }
      } finally {
        window.clearTimeout(hardStopId);
        if (!cancelled) setIsLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setIsLoading(true);
        void load(session);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) {
          setIsLoading(true);
          void load(session);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Error getting auth session:", error);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const hasAccess = useCallback(
    (module: string, action: ModuleAction = "can_view"): boolean => {
      if (isAdmin) return true;
      return access[module]?.[action] ?? defaultPerm[action];
    },
    [isAdmin, access],
  );

  return useMemo(
    () => ({ access, isAdmin, isLoading, hasAccess, userId }),
    [access, isAdmin, isLoading, hasAccess, userId],
  );
}

export function ModuleAccessProvider({ children }: { children: ReactNode }) {
  const value = useModuleAccessState();
  return createElement(ModuleAccessContext.Provider, { value }, children);
}

export function useModuleAccess() {
  const context = useContext(ModuleAccessContext);

  if (!context) {
    throw new Error("useModuleAccess deve ser usado dentro de ModuleAccessProvider");
  }

  return context;
}

