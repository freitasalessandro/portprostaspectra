
-- Create transfer history table
CREATE TABLE public.ticket_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  from_atendente_id UUID,
  to_atendente_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transfers via ticket" ON public.ticket_transfers
FOR SELECT USING (EXISTS (
  SELECT 1 FROM tickets WHERE tickets.id = ticket_transfers.ticket_id AND tickets.user_id = auth.uid()
));

CREATE POLICY "Users can insert transfers via ticket" ON public.ticket_transfers
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM tickets WHERE tickets.id = ticket_transfers.ticket_id AND tickets.user_id = auth.uid()
));

-- Auto-log transfers when atendente_id changes
CREATE OR REPLACE FUNCTION public.log_ticket_transfer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF OLD.atendente_id IS DISTINCT FROM NEW.atendente_id THEN
    INSERT INTO public.ticket_transfers (ticket_id, from_atendente_id, to_atendente_id)
    VALUES (NEW.id, OLD.atendente_id, NEW.atendente_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_ticket_transfer
BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.log_ticket_transfer();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_transfers;
