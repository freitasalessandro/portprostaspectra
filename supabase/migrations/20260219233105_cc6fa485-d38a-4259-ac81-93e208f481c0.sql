
ALTER TABLE public.company_settings
ADD COLUMN ai_provider text NOT NULL DEFAULT 'lovable'
CHECK (ai_provider IN ('lovable', 'anthropic'));
