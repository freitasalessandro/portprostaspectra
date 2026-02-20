
-- Add Evolution API fields to company_settings
ALTER TABLE public.company_settings
ADD COLUMN evolution_api_url TEXT DEFAULT 'https://wpp.spectra.tec.br',
ADD COLUMN evolution_api_token TEXT,
ADD COLUMN evolution_api_instance TEXT;
