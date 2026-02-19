
ALTER TABLE public.proposal_items 
ADD COLUMN payment_type text NOT NULL DEFAULT 'setup',
ADD COLUMN payment_terms text NULL;

COMMENT ON COLUMN public.proposal_items.payment_type IS 'setup or recurring';
COMMENT ON COLUMN public.proposal_items.payment_terms IS 'Payment conditions for setup items';
