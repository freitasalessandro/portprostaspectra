
CREATE TABLE public.portfolio_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL,
  label text NOT NULL DEFAULT '',
  title_bold text NOT NULL DEFAULT '',
  title_light text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(section_key, user_id)
);

ALTER TABLE public.portfolio_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio sections" ON public.portfolio_sections
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own portfolio sections" ON public.portfolio_sections
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
