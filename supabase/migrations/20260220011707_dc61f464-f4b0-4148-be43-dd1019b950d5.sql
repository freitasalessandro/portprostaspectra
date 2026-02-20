
-- Templates de mensagem
CREATE TABLE public.communication_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own templates" ON public.communication_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_communication_templates_updated_at
BEFORE UPDATE ON public.communication_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Gatilhos de comunicação
CREATE TABLE public.communication_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event TEXT NOT NULL,
  template_id UUID NOT NULL REFERENCES public.communication_templates(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL DEFAULT 'cliente',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.communication_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own triggers" ON public.communication_triggers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_communication_triggers_updated_at
BEFORE UPDATE ON public.communication_triggers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Histórico de comunicações
CREATE TABLE public.communication_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  destination_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviado',
  message_sent TEXT NOT NULL,
  error_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.communication_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own history" ON public.communication_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
