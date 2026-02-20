DROP VIEW IF EXISTS public.public_contracts;
CREATE VIEW public.public_contracts AS
SELECT id, title, content, status, slug, access_code, client_name, created_at, updated_at, proposal_id
FROM contracts;