
-- Create storage bucket for service files
INSERT INTO storage.buckets (id, name, public) VALUES ('service-files', 'service-files', true);

-- Storage policies
CREATE POLICY "Anyone can view service files" ON storage.objects FOR SELECT USING (bucket_id = 'service-files');

CREATE POLICY "Authenticated users can upload service files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-files');

CREATE POLICY "Authenticated users can update service files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'service-files');

CREATE POLICY "Authenticated users can delete service files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'service-files');

-- Table to track service files
CREATE TABLE public.service_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'image',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.service_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service files" ON public.service_files FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage service files" ON public.service_files FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM services WHERE services.id = service_files.service_id AND services.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM services WHERE services.id = service_files.service_id AND services.user_id = auth.uid()));
