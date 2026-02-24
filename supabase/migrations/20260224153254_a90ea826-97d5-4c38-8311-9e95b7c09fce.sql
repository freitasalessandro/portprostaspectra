
-- Allow all authenticated users to view communication history
CREATE POLICY "Authenticated users can view all history"
ON public.communication_history
FOR SELECT
USING (true);
