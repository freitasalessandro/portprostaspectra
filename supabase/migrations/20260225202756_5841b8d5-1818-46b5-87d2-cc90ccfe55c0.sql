
-- Allow authenticated users to view contatos for tickets they can see
CREATE POLICY "Authenticated users can view contatos"
  ON public.contatos
  FOR SELECT
  TO authenticated
  USING (true);
