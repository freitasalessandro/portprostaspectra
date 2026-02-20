
-- Add client_type to proposals (pf or pj)
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_type text NOT NULL DEFAULT 'pf';
