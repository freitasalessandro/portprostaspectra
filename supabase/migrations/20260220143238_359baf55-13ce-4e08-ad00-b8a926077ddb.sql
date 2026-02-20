
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view signatures" ON public.proposal_signatures;

-- Create a restricted SELECT policy for proposal owners only
CREATE POLICY "Owners can view signatures"
ON public.proposal_signatures
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.proposals
    WHERE proposals.id = proposal_signatures.proposal_id
      AND proposals.user_id = auth.uid()
  )
);
