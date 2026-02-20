
-- Drop the permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view proposals by direct link" ON public.proposals;

-- Only authenticated users (owners) can SELECT from proposals table
CREATE POLICY "Authenticated users can view their own proposals"
ON public.proposals FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Create a public view without sensitive fields for proposal viewing
CREATE OR REPLACE VIEW public.public_proposals AS
SELECT
  id,
  client_name,
  project_title,
  total_value,
  setup_total,
  recurring_total,
  status,
  type,
  description,
  notes,
  valid_until,
  slug,
  accepted_at,
  accepted_by_name,
  bdi_factor,
  created_at,
  updated_at
FROM public.proposals;

-- Grant public access to the view
GRANT SELECT ON public.public_proposals TO anon, authenticated;
