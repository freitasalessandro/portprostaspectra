
CREATE TABLE public.frontend_error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  error_type text NOT NULL DEFAULT 'unknown',
  error_message text,
  error_stack text,
  route text,
  context text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.frontend_error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert their own errors
CREATE POLICY "Users can insert own error logs"
  ON public.frontend_error_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anon users can also log errors (for public pages)
CREATE POLICY "Anon can insert error logs"
  ON public.frontend_error_logs FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Admins can view all error logs
CREATE POLICY "Admins can view all error logs"
  ON public.frontend_error_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-cleanup: keep only last 30 days (index for efficient queries)
CREATE INDEX idx_frontend_error_logs_created_at ON public.frontend_error_logs (created_at DESC);
CREATE INDEX idx_frontend_error_logs_error_type ON public.frontend_error_logs (error_type);
