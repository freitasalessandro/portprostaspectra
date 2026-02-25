
-- Drop and recreate views with security_invoker=on
DROP VIEW IF EXISTS public.public_proposals;
DROP VIEW IF EXISTS public.public_contracts;

CREATE VIEW public.public_proposals
WITH (security_invoker=on) AS
SELECT
  id, project_title, client_name, client_type, type,
  description, notes, status, total_value, setup_total,
  recurring_total, bdi_factor, slug, access_code,
  valid_until, accepted_at, accepted_by_name,
  created_at, updated_at
FROM public.proposals;

CREATE VIEW public.public_contracts
WITH (security_invoker=on) AS
SELECT
  id, title, client_name, content, status, slug,
  access_code, proposal_id, created_at, updated_at
FROM public.contracts;
