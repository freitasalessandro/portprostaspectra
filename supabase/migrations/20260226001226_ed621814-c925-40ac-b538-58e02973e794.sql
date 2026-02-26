
-- =============================================
-- Fix: Convert RESTRICTIVE policies to PERMISSIVE
-- on user_roles and user_module_access tables
-- =============================================

-- Drop existing RESTRICTIVE policies on user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;

-- Recreate as PERMISSIVE
CREATE POLICY "Authenticated users can view roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Drop existing RESTRICTIVE policies on user_module_access
DROP POLICY IF EXISTS "Admins can manage module access" ON public.user_module_access;
DROP POLICY IF EXISTS "Users can view own module access" ON public.user_module_access;

-- Recreate as PERMISSIVE
CREATE POLICY "Users can view own module access"
  ON public.user_module_access
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage module access"
  ON public.user_module_access
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
