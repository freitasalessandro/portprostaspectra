
-- Allow all authenticated users to SELECT tickets with status ABERTO or AGUARDANDO (waiting queue)
-- This enables non-admin atendentes to see the waiting queue
CREATE POLICY "Authenticated users can view waiting queue tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (status IN ('ABERTO', 'AGUARDANDO'));

-- Also allow authenticated users to view all active tickets (for "Todos" tab)
CREATE POLICY "Authenticated users can view active tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (status IN ('EM_ATENDIMENTO'));
