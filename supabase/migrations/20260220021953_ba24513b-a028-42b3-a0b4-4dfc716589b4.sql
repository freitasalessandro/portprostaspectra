
-- Contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Novo Contrato',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  slug TEXT,
  access_code TEXT DEFAULT lpad((floor(random() * 1000000))::text, 6, '0'),
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contracts" ON public.contracts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contract signatures table
CREATE TABLE public.contract_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  selfie_path TEXT NOT NULL,
  document_path TEXT NOT NULL,
  signature_hash TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can sign contracts" ON public.contract_signatures FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view signatures" ON public.contract_signatures FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage signatures" ON public.contract_signatures FOR ALL
  USING (EXISTS (SELECT 1 FROM contracts WHERE contracts.id = contract_signatures.contract_id AND contracts.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM contracts WHERE contracts.id = contract_signatures.contract_id AND contracts.user_id = auth.uid()));

-- Public view for contracts (no sensitive data)
CREATE VIEW public.public_contracts AS
  SELECT id, title, content, status, slug, access_code, client_name, created_at, updated_at
  FROM public.contracts;

GRANT SELECT ON public.public_contracts TO anon, authenticated;

-- Storage bucket for contract signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-signatures', 'contract-signatures', false);

CREATE POLICY "Anyone can upload contract signature files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'contract-signatures');

CREATE POLICY "Authenticated users can view contract signature files" ON storage.objects FOR SELECT
  USING (bucket_id = 'contract-signatures');
