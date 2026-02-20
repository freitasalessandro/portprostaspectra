
-- 1. proposal_views: validate proposal exists
DROP POLICY IF EXISTS "Anyone can insert views" ON public.proposal_views;
CREATE POLICY "Anyone can insert views for valid proposals"
ON public.proposal_views
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_views.proposal_id)
);

-- 2. proposal_signatures: validate proposal exists and is not already accepted
DROP POLICY IF EXISTS "Anyone can sign a proposal" ON public.proposal_signatures;
CREATE POLICY "Anyone can sign a valid proposal"
ON public.proposal_signatures
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.proposals
    WHERE proposals.id = proposal_signatures.proposal_id
      AND proposals.status != 'accepted'
  )
);

-- 3. contract_signatures: validate contract exists
DROP POLICY IF EXISTS "Anyone can sign contracts" ON public.contract_signatures;
CREATE POLICY "Anyone can sign valid contracts"
ON public.contract_signatures
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.contracts WHERE contracts.id = contract_signatures.contract_id)
);
