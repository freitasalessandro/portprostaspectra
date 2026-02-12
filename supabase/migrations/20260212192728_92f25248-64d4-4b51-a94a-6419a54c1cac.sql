
-- Add new fields to proposals
ALTER TABLE public.proposals 
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'cto',
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS accepted_by_name text,
  ADD COLUMN IF NOT EXISTS accepted_by_email text;

-- Create proposal_sections for flexible content per section
CREATE TABLE public.proposal_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view proposal sections"
  ON public.proposal_sections FOR SELECT
  USING (true);

CREATE POLICY "Users can manage sections of their proposals"
  ON public.proposal_sections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM proposals WHERE proposals.id = proposal_sections.proposal_id AND proposals.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM proposals WHERE proposals.id = proposal_sections.proposal_id AND proposals.user_id = auth.uid()
  ));

-- Create proposal_social_proof for admin-selected cases
CREATE TABLE public.proposal_social_proof (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  case_title text NOT NULL,
  case_category text NOT NULL,
  case_description text NOT NULL,
  case_metric text,
  case_metric_label text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_social_proof ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social proof"
  ON public.proposal_social_proof FOR SELECT
  USING (true);

CREATE POLICY "Users can manage social proof of their proposals"
  ON public.proposal_social_proof FOR ALL
  USING (EXISTS (
    SELECT 1 FROM proposals WHERE proposals.id = proposal_social_proof.proposal_id AND proposals.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM proposals WHERE proposals.id = proposal_social_proof.proposal_id AND proposals.user_id = auth.uid()
  ));

-- Allow anyone to update accepted fields (for client acceptance)
CREATE POLICY "Anyone can accept a proposal"
  ON public.proposals FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add index for performance
CREATE INDEX idx_proposal_sections_proposal_id ON public.proposal_sections(proposal_id);
CREATE INDEX idx_proposal_social_proof_proposal_id ON public.proposal_social_proof(proposal_id);
