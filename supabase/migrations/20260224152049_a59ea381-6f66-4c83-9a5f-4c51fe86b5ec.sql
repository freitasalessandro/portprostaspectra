-- Permitir que o operador atribuído visualize e gerencie tickets encaminhados
DROP POLICY IF EXISTS "Users can manage own tickets" ON public.tickets;
CREATE POLICY "Users can manage own tickets"
ON public.tickets
FOR ALL
USING (
  auth.uid() = user_id
  OR auth.uid() = atendente_id
)
WITH CHECK (
  auth.uid() = user_id
  OR auth.uid() = atendente_id
);

-- Permitir acesso às mensagens quando o usuário é dono do ticket OU operador atribuído
DROP POLICY IF EXISTS "Users can manage mensagens via ticket" ON public.mensagens;
CREATE POLICY "Users can manage mensagens via ticket"
ON public.mensagens
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE tickets.id = mensagens.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.atendente_id = auth.uid()
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE tickets.id = mensagens.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.atendente_id = auth.uid()
      )
  )
);

-- Permitir timeline de transferência para operador atribuído
DROP POLICY IF EXISTS "Users can insert transfers via ticket" ON public.ticket_transfers;
CREATE POLICY "Users can insert transfers via ticket"
ON public.ticket_transfers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE tickets.id = ticket_transfers.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.atendente_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "Users can view transfers via ticket" ON public.ticket_transfers;
CREATE POLICY "Users can view transfers via ticket"
ON public.ticket_transfers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE tickets.id = ticket_transfers.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.atendente_id = auth.uid()
      )
  )
);