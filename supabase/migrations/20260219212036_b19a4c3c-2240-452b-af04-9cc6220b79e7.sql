
ALTER TABLE public.company_settings
  ADD COLUMN bdi_tax numeric NOT NULL DEFAULT 0,
  ADD COLUMN bdi_admin numeric NOT NULL DEFAULT 0,
  ADD COLUMN bdi_risk numeric NOT NULL DEFAULT 0,
  ADD COLUMN bdi_profit numeric NOT NULL DEFAULT 0;
