import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Permission = {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

type ModuleAccessMap = Record<string, Permission>;

const defaultPerm: Permission = { can_view: false, can_create: false, can_edit: false, can_delete: false };
const QUERY_TIMEOUT_MS = 8000;

async function withTimeout<T>(promiseLike: PromiseLike<T>, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    const id = window.setTimeout(() => {
      window.clearTimeout(id);
      reject(new Error(`Timeout em ${label}`));
    }, QUERY_TIMEOUT_MS);
  });

  return Promise.race([Promise.resolve(promiseLike), timeout]);
}

export function useModuleAccess() {
  const [access, setAccess] = useState<ModuleAccessMap>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (session: any) => {
      if (!session || cancelled) {
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
        if (!cancelled) setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setIsLoading(true);
        load(session);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        setIsLoading(true);
        load(session);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const hasAccess = useCallback(
    (module: string, action: keyof Permission = "can_view"): boolean => {
      if (isAdmin) return true;
      return access[module]?.[action] ?? defaultPerm[action];
    },
    [isAdmin, access]
  );

  return { access, isAdmin, isLoading, hasAccess, userId };
}
