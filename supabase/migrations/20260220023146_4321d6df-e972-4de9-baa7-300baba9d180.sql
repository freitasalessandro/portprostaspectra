
DROP VIEW IF EXISTS public.public_proposals;
CREATE VIEW public.public_proposals AS
SELECT id, client_name, project_title, total_value, setup_total, recurring_total, status, type, client_type, description, notes, valid_until, slug, accepted_at, accepted_by_name, bdi_factor, created_at, updated_at, access_code
FROM proposals;
