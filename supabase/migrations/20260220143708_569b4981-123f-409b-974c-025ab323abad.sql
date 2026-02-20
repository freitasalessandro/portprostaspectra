
-- Recreate public_proposals with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_proposals;
CREATE VIEW public.public_proposals
WITH (security_invoker = on) AS
SELECT id, client_name, project_title, total_value, setup_total, recurring_total,
       status, type, client_type, description, notes, valid_until, slug,
       accepted_at, accepted_by_name, bdi_factor, created_at, updated_at, access_code
FROM public.proposals;

-- Recreate public_contracts with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_contracts;
CREATE VIEW public.public_contracts
WITH (security_invoker = on) AS
SELECT id, title, content, status, slug, access_code, client_name,
       created_at, updated_at, proposal_id
FROM public.contracts;
