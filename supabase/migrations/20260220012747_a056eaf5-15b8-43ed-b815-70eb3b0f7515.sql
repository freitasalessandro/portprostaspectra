
CREATE TABLE public.proposal_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (public page)
CREATE POLICY "Anyone can insert views" ON public.proposal_views FOR INSERT WITH CHECK (true);

-- Only authenticated proposal owners can read views
CREATE POLICY "Owners can view their proposal views" ON public.proposal_views FOR SELECT
USING (EXISTS (
  SELECT 1 FROM proposals WHERE proposals.id = proposal_views.proposal_id AND proposals.user_id = auth.uid()
));
