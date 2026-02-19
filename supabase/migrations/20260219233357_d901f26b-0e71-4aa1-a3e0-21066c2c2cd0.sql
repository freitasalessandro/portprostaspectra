
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS anthropic_api_key text NULL;
