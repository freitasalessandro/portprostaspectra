
-- Fix contatos: make shared-resource policies PERMISSIVE so any authenticated user can upsert
DROP POLICY IF EXISTS "Authenticated users can insert contatos" ON public.contatos;
DROP POLICY IF EXISTS "Authenticated users can update contatos" ON public.contatos;
DROP POLICY IF EXISTS "Authenticated users can view contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can manage own contatos" ON public.contatos;

-- PERMISSIVE: any authenticated user can read all contatos
CREATE POLICY "Authenticated users can view contatos"
  ON public.contatos FOR SELECT TO authenticated
  USING (true);

-- PERMISSIVE: any authenticated user can insert contatos (setting their own user_id)
CREATE POLICY "Authenticated users can insert contatos"
  ON public.contatos FOR INSERT TO authenticated
  WITH CHECK (true);

-- PERMISSIVE: any authenticated user can update any contato (shared resource)
CREATE POLICY "Authenticated users can update contatos"
  ON public.contatos FOR UPDATE TO authenticated
  USING (true);

-- Fix tickets: add PERMISSIVE insert policy for any authenticated user
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON public.tickets;
CREATE POLICY "Authenticated users can insert tickets"
  ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = atendente_id);

-- Fix tickets: add PERMISSIVE update for assigned atendentes (not just open tickets)
DROP POLICY IF EXISTS "Authenticated users can update assigned tickets" ON public.tickets;
CREATE POLICY "Authenticated users can update assigned tickets"
  ON public.tickets FOR UPDATE TO authenticated
  USING (auth.uid() = atendente_id);
