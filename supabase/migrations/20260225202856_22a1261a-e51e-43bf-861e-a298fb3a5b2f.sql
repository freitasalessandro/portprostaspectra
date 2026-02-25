
-- Allow authenticated users to read mensagens for any ticket they can see
-- (tickets RLS already controls which tickets are visible)
CREATE POLICY "Authenticated users can view mensagens for visible tickets"
  ON public.mensagens
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = mensagens.ticket_id
    )
  );

-- Allow authenticated users to insert mensagens on tickets they are assigned to
CREATE POLICY "Atendentes can insert mensagens on assigned tickets"
  ON public.mensagens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = mensagens.ticket_id
      AND (t.user_id = auth.uid() OR t.atendente_id = auth.uid())
    )
  );

-- Allow authenticated users to view ticket_transfers for visible tickets
CREATE POLICY "Authenticated users can view transfers"
  ON public.ticket_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_transfers.ticket_id
    )
  );
