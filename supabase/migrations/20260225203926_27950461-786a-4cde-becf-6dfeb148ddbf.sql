
-- Allow admins to manage all atendentes_perfil records
CREATE POLICY "Admins can manage all atendente profiles"
  ON public.atendentes_perfil FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
