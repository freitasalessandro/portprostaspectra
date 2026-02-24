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

export function useModuleAccess() {
  const [access, setAccess] = useState<ModuleAccessMap>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (session: any) => {
      if (!session || cancelled) {
        setIsLoading(false);
        return;
      }

      try {
        const uid = session.user.id;
        setUserId(uid);

        // Check admin role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .eq("role", "admin")
          .maybeSingle();

        if (cancelled) return;

        if (roleError) {
          console.error("Error checking admin role:", roleError);
          setIsLoading(false);
          return;
        }

        if (roleData) {
          setIsAdmin(true);
          setAccess({});
          setIsLoading(false);
          return;
        }

        // Load module permissions
        const { data, error: accessError } = await supabase
          .from("user_module_access")
          .select("module, can_view, can_create, can_edit, can_delete")
          .eq("user_id", uid);

        if (cancelled) return;

        if (accessError) {
          console.error("Error loading module access:", accessError);
          setIsLoading(false);
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
        console.error("useModuleAccess error:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    // Listen for auth state changes to handle session restore
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setIsLoading(true);
        load(session);
      }
    });

    // Also try immediately with current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) load(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const hasAccess = useCallback(
    (module: string, action: keyof Permission = "can_view"): boolean => {
      if (isAdmin) return true;
      return access[module]?.[action] ?? false;
    },
    [isAdmin, access]
  );

  return { access, isAdmin, isLoading, hasAccess, userId };
}
