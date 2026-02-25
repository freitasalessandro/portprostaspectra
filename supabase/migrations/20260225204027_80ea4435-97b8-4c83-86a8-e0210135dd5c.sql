
-- Allow any authenticated user to insert new contatos
CREATE POLICY "Authenticated users can insert contatos"
  ON public.contatos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow any authenticated user to update contatos (shared resource)
CREATE POLICY "Authenticated users can update contatos"
  ON public.contatos FOR UPDATE
  TO authenticated
  USING (true);

-- Allow any authenticated user to insert mensagens on tickets they own or are assigned to
CREATE POLICY "Authenticated users can insert mensagens on own tickets"
  ON public.mensagens FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = mensagens.ticket_id
      AND (t.user_id = auth.uid() OR t.atendente_id = auth.uid())
    )
  );
