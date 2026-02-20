
-- Add contract_data jsonb to proposal_signatures
ALTER TABLE public.proposal_signatures
ADD COLUMN contract_data jsonb DEFAULT NULL;

-- Add proposal_id to contracts for linking
ALTER TABLE public.contracts
ADD COLUMN proposal_id uuid REFERENCES public.proposals(id) DEFAULT NULL;
