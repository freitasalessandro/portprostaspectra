
-- Add access_code column
ALTER TABLE public.proposals ADD COLUMN access_code text DEFAULT LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0') NOT NULL;

-- Generate codes for existing proposals
UPDATE public.proposals SET access_code = LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');

-- Recreate view with access_code keeping original column order
DROP VIEW IF EXISTS public.public_proposals;
CREATE VIEW public.public_proposals AS
SELECT 
  id, client_name, project_title, total_value, setup_total, recurring_total,
  status, type, description, notes, valid_until, slug,
  accepted_at, accepted_by_name, bdi_factor, created_at, updated_at, access_code
FROM public.proposals;
