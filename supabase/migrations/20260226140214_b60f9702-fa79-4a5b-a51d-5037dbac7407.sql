
-- =============================================
-- Fix: Convert ALL RESTRICTIVE policies to PERMISSIVE
-- on atendimento-critical tables so collaborators can operate
-- =============================================

-- ============ TICKETS ============
DROP POLICY IF EXISTS "Authenticated users can view active tickets" ON public.tickets;
DROP POLICY IF EXISTS "Authenticated users can view waiting queue tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can manage own tickets" ON public.tickets;

-- Authenticated can view open/waiting tickets (queue)
CREATE POLICY "Authenticated users can view waiting queue tickets"
  ON public.tickets FOR SELECT TO authenticated
  USING (status = ANY (ARRAY['ABERTO'::ticket_status, 'AGUARDANDO'::ticket_status]));

-- Authenticated can view active tickets
CREATE POLICY "Authenticated users can view active tickets"
  ON public.tickets FOR SELECT TO authenticated
  USING (status = 'EM_ATENDIMENTO'::ticket_status);

-- Owner or assigned agent can fully manage
CREATE POLICY "Users can manage own tickets"
  ON public.tickets FOR ALL TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = atendente_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = atendente_id);

-- Allow any authenticated user to assume an open ticket (UPDATE atendente_id)
CREATE POLICY "Authenticated users can assume open tickets"
  ON public.tickets FOR UPDATE TO authenticated
  USING (status = 'ABERTO'::ticket_status AND atendente_id IS NULL);

-- Allow viewing closed tickets for history
CREATE POLICY "Authenticated users can view closed tickets"
  ON public.tickets FOR SELECT TO authenticated
  USING (status = ANY (ARRAY['ENCERRADO'::ticket_status, 'CANCELADO'::ticket_status]));

-- ============ MENSAGENS ============
DROP POLICY IF EXISTS "Atendentes can insert mensagens on assigned tickets" ON public.mensagens;
DROP POLICY IF EXISTS "Authenticated users can insert mensagens on own tickets" ON public.mensagens;
DROP POLICY IF EXISTS "Authenticated users can view mensagens for visible tickets" ON public.mensagens;
DROP POLICY IF EXISTS "Users can manage mensagens via ticket" ON public.mensagens;

-- View messages for any visible ticket
CREATE POLICY "Authenticated users can view mensagens for visible tickets"
  ON public.mensagens FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tickets t WHERE t.id = mensagens.ticket_id));

-- Insert messages on tickets user owns or is assigned to, OR on open tickets (assuming)
CREATE POLICY "Authenticated users can insert mensagens"
  ON public.mensagens FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = mensagens.ticket_id
        AND (t.user_id = auth.uid() OR t.atendente_id = auth.uid() OR t.status = 'ABERTO'::ticket_status)
    )
  );

-- Full manage for owner/assigned
CREATE POLICY "Users can manage mensagens via ticket"
  ON public.mensagens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM tickets WHERE tickets.id = mensagens.ticket_id AND (tickets.user_id = auth.uid() OR tickets.atendente_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM tickets WHERE tickets.id = mensagens.ticket_id AND (tickets.user_id = auth.uid() OR tickets.atendente_id = auth.uid())));

-- ============ CONTATOS ============
DROP POLICY IF EXISTS "Authenticated users can insert contatos" ON public.contatos;
DROP POLICY IF EXISTS "Authenticated users can update contatos" ON public.contatos;
DROP POLICY IF EXISTS "Authenticated users can view contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can manage own contatos" ON public.contatos;

CREATE POLICY "Authenticated users can view contatos"
  ON public.contatos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert contatos"
  ON public.contatos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update contatos"
  ON public.contatos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can manage own contatos"
  ON public.contatos FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============ ATENDENTES_PERFIL ============
DROP POLICY IF EXISTS "Admins can manage all atendente profiles" ON public.atendentes_perfil;
DROP POLICY IF EXISTS "Users can manage own atendente profile" ON public.atendentes_perfil;
DROP POLICY IF EXISTS "Users can view atendentes" ON public.atendentes_perfil;

CREATE POLICY "Users can view atendentes"
  ON public.atendentes_perfil FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own atendente profile"
  ON public.atendentes_perfil FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all atendente profiles"
  ON public.atendentes_perfil FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ TICKET_TRANSFERS ============
DROP POLICY IF EXISTS "Authenticated users can view transfers" ON public.ticket_transfers;
DROP POLICY IF EXISTS "Users can insert transfers via ticket" ON public.ticket_transfers;
DROP POLICY IF EXISTS "Users can view transfers via ticket" ON public.ticket_transfers;

CREATE POLICY "Authenticated users can view transfers"
  ON public.ticket_transfers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_transfers.ticket_id));

CREATE POLICY "Authenticated users can insert transfers"
  ON public.ticket_transfers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_transfers.ticket_id AND (t.user_id = auth.uid() OR t.atendente_id = auth.uid())));

-- ============ COMPANY_SETTINGS (read for atendimento API config) ============
-- Add permissive SELECT for authenticated users (needed by edge functions context)
DROP POLICY IF EXISTS "Users can view their own settings" ON public.company_settings;
CREATE POLICY "Users can view their own settings"
  ON public.company_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============ RESPOSTAS_RAPIDAS ============
DROP POLICY IF EXISTS "Users can manage own respostas_rapidas" ON public.respostas_rapidas;
CREATE POLICY "Users can manage own respostas_rapidas"
  ON public.respostas_rapidas FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow all authenticated to view (for quick replies in chat)
CREATE POLICY "Authenticated users can view respostas_rapidas"
  ON public.respostas_rapidas FOR SELECT TO authenticated
  USING (true);

-- ============ MOTIVOS_ATENDIMENTO ============
DROP POLICY IF EXISTS "Anyone can view active motivos" ON public.motivos_atendimento;
DROP POLICY IF EXISTS "Users can manage own motivos" ON public.motivos_atendimento;

CREATE POLICY "Anyone can view active motivos"
  ON public.motivos_atendimento FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own motivos"
  ON public.motivos_atendimento FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
