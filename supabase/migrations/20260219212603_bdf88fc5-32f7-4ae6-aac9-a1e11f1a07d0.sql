
-- Add slug column with unique constraint
ALTER TABLE public.proposals ADD COLUMN slug text UNIQUE;

-- Create index for slug lookups
CREATE INDEX idx_proposals_slug ON public.proposals(slug);

-- Add BDI factor to proposals for historical record
ALTER TABLE public.proposals ADD COLUMN bdi_factor numeric;
