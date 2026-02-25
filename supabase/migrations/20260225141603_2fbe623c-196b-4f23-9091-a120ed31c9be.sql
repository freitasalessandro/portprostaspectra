
-- Drop existing policies on proposal_signatures
DROP POLICY IF EXISTS "Anyone can sign a valid proposal" ON public.proposal_signatures;
DROP POLICY IF EXISTS "Authenticated users can manage signatures" ON public.proposal_signatures;
DROP POLICY IF EXISTS "Owners can view signatures" ON public.proposal_signatures;

-- 1. SELECT: Only authenticated proposal owners can view signatures
CREATE POLICY "Owners can view signatures"
ON public.proposal_signatures FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.proposals
    WHERE proposals.id = proposal_signatures.proposal_id
    AND proposals.user_id = auth.uid()
  )
);

-- 2. INSERT: Only anon/authenticated can sign valid (non-accepted) proposals
CREATE POLICY "Anyone can sign a valid proposal"
ON public.proposal_signatures FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.proposals
    WHERE proposals.id = proposal_signatures.proposal_id
    AND proposals.status <> 'accepted'
  )
);

-- 3. UPDATE/DELETE: Only authenticated proposal owners
CREATE POLICY "Owners can manage signatures"
ON public.proposal_signatures FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.proposals
    WHERE proposals.id = proposal_signatures.proposal_id
    AND proposals.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.proposals
    WHERE proposals.id = proposal_signatures.proposal_id
    AND proposals.user_id = auth.uid()
  )
);
