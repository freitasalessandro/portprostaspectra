
-- Add separate Evolution API fields for atendimento (chat/support)
-- The existing evolution_api_* fields remain for proposals/communications ("spectra" instance)
ALTER TABLE public.company_settings 
  ADD COLUMN IF NOT EXISTS atendimento_api_url text DEFAULT 'https://wpp.spectra.tec.br',
  ADD COLUMN IF NOT EXISTS atendimento_api_instance text,
  ADD COLUMN IF NOT EXISTS atendimento_api_token text;
