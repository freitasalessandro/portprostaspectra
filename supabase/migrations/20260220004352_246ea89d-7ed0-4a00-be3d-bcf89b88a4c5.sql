
-- Create proposal signatures table
CREATE TABLE public.proposal_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  signature_hash TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposal_signatures ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public approval flow)
CREATE POLICY "Anyone can sign a proposal"
ON public.proposal_signatures
FOR INSERT
WITH CHECK (true);

-- Anyone can view signatures (needed for public confirmation display)
CREATE POLICY "Anyone can view signatures"
ON public.proposal_signatures
FOR SELECT
USING (true);

-- Authenticated users can manage via admin
CREATE POLICY "Authenticated users can manage signatures"
ON public.proposal_signatures
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM proposals
    WHERE proposals.id = proposal_signatures.proposal_id
    AND proposals.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM proposals
    WHERE proposals.id = proposal_signatures.proposal_id
    AND proposals.user_id = auth.uid()
  )
);
