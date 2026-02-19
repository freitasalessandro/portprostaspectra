
ALTER TABLE public.proposals
ADD COLUMN setup_total numeric NOT NULL DEFAULT 0,
ADD COLUMN recurring_total numeric NOT NULL DEFAULT 0;
