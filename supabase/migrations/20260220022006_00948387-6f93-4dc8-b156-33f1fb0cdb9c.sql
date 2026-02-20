
-- Fix security definer view for public_contracts
DROP VIEW IF EXISTS public.public_contracts;
CREATE VIEW public.public_contracts WITH (security_invoker = true) AS
  SELECT id, title, content, status, slug, access_code, client_name, created_at, updated_at
  FROM public.contracts;

GRANT SELECT ON public.public_contracts TO anon, authenticated;

-- Add RLS SELECT policy for anon access to contracts via view
CREATE POLICY "Anyone can view contracts via view" ON public.contracts FOR SELECT
  USING (true);
