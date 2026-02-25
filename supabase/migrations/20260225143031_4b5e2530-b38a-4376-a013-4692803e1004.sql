
-- Restrict proposal_social_proof SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view social proof" ON public.proposal_social_proof;

CREATE POLICY "Authenticated users can view social proof"
  ON public.proposal_social_proof FOR SELECT
  TO authenticated
  USING (true);
