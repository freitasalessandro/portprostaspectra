
-- Enum para status do ticket
CREATE TYPE public.ticket_status AS ENUM ('ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO', 'ENCERRADO', 'CANCELADO');
CREATE TYPE public.sla_status AS ENUM ('OK', 'ALERTA', 'VIOLADO');
CREATE TYPE public.msg_sentido AS ENUM ('ENTRADA', 'SAIDA', 'SISTEMA');
CREATE TYPE public.msg_tipo AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT');
CREATE TYPE public.msg_status_envio AS ENUM ('ENVIANDO', 'ENVIADO', 'ENTREGUE', 'LIDO', 'ERRO');
CREATE TYPE public.prioridade AS ENUM ('1', '2', '3');

-- Motivos de atendimento
CREATE TABLE public.motivos_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  sla_minutos INTEGER NOT NULL DEFAULT 60,
  prioridade public.prioridade NOT NULL DEFAULT '2',
  cor_hex TEXT NOT NULL DEFAULT '#3B82F6',
  ativo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.motivos_atendimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own motivos" ON public.motivos_atendimento FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view active motivos" ON public.motivos_atendimento FOR SELECT USING (true);

-- Contatos
CREATE TABLE public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number TEXT NOT NULL UNIQUE,
  nome TEXT,
  email TEXT,
  empresa TEXT,
  notas TEXT,
  total_tickets INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own contatos" ON public.contatos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_contatos_updated_at BEFORE UPDATE ON public.contatos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sequence for ticket numbering per month
CREATE SEQUENCE public.ticket_number_seq;

-- Tickets
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL DEFAULT nextval('public.ticket_number_seq'),
  contato_id UUID NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  whatsapp_number TEXT NOT NULL,
  motivo_id UUID REFERENCES public.motivos_atendimento(id),
  atendente_id UUID,
  status public.ticket_status NOT NULL DEFAULT 'ABERTO',
  sla_status public.sla_status NOT NULL DEFAULT 'OK',
  protocolo TEXT UNIQUE,
  tags TEXT[] DEFAULT '{}',
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assumed_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  tempo_total_min INTEGER,
  tempo_resposta_min INTEGER
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tickets" ON public.tickets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Mensagens
CREATE TABLE public.mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  evolution_id TEXT UNIQUE,
  sentido public.msg_sentido NOT NULL,
  tipo public.msg_tipo NOT NULL DEFAULT 'TEXT',
  conteudo TEXT,
  midia_url TEXT,
  atendente_id UUID,
  assinatura TEXT,
  status_envio public.msg_status_envio DEFAULT 'ENVIADO',
  timestamp_wa TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage mensagens via ticket" ON public.mensagens FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.tickets WHERE tickets.id = mensagens.ticket_id AND tickets.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tickets WHERE tickets.id = mensagens.ticket_id AND tickets.user_id = auth.uid()));

-- Atendentes perfil
CREATE TABLE public.atendentes_perfil (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  setor TEXT,
  assinatura_padrao TEXT,
  assinatura_ativa BOOLEAN NOT NULL DEFAULT true,
  max_tickets INTEGER NOT NULL DEFAULT 10,
  disponivel BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.atendentes_perfil ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view atendentes" ON public.atendentes_perfil FOR SELECT USING (true);
CREATE POLICY "Users can manage own atendente profile" ON public.atendentes_perfil FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_atendentes_updated_at BEFORE UPDATE ON public.atendentes_perfil FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: gerar protocolo no INSERT do ticket
CREATE OR REPLACE FUNCTION public.generate_ticket_protocolo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_month TEXT;
  seq_num INTEGER;
BEGIN
  year_month := to_char(NOW(), 'YYYY-MM');
  SELECT COALESCE(MAX(
    CAST(split_part(protocolo, '-', 3) AS INTEGER)
  ), 0) + 1 INTO seq_num
  FROM public.tickets
  WHERE protocolo LIKE year_month || '-%';
  
  NEW.protocolo := year_month || '-' || lpad(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_protocolo
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.generate_ticket_protocolo();

-- Trigger: calcular sla_deadline quando motivo_id é definido
CREATE OR REPLACE FUNCTION public.calculate_sla_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sla_min INTEGER;
BEGIN
  IF NEW.motivo_id IS NOT NULL AND (OLD.motivo_id IS DISTINCT FROM NEW.motivo_id) THEN
    SELECT sla_minutos INTO sla_min FROM public.motivos_atendimento WHERE id = NEW.motivo_id;
    IF sla_min IS NOT NULL THEN
      NEW.sla_deadline := NOW() + (sla_min || ' minutes')::INTERVAL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calculate_sla
BEFORE INSERT OR UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.calculate_sla_deadline();

-- Trigger: ao encerrar ticket, gravar métricas
CREATE OR REPLACE FUNCTION public.close_ticket_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'ENCERRADO' AND OLD.status != 'ENCERRADO' THEN
    NEW.closed_at := NOW();
    NEW.tempo_total_min := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 60;
    IF NEW.first_response_at IS NOT NULL THEN
      NEW.tempo_resposta_min := EXTRACT(EPOCH FROM (NEW.first_response_at - NEW.created_at)) / 60;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_close_ticket_metrics
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.close_ticket_metrics();

-- Trigger: gravar first_response_at
CREATE OR REPLACE FUNCTION public.set_first_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sentido = 'SAIDA' THEN
    UPDATE public.tickets
    SET first_response_at = NOW()
    WHERE id = NEW.ticket_id AND first_response_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_first_response
AFTER INSERT ON public.mensagens
FOR EACH ROW
EXECUTE FUNCTION public.set_first_response();

-- View: kpi_dashboard
CREATE OR REPLACE VIEW public.kpi_dashboard AS
SELECT
  DATE(created_at) AS dia,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'ENCERRADO') AS encerrados,
  COUNT(*) FILTER (WHERE sla_status = 'OK' AND status = 'ENCERRADO') AS sla_ok,
  COUNT(*) FILTER (WHERE sla_status = 'VIOLADO') AS sla_violado,
  ROUND(AVG(tempo_resposta_min) FILTER (WHERE tempo_resposta_min IS NOT NULL), 1) AS tmr_minutos,
  ROUND(AVG(tempo_total_min) FILTER (WHERE tempo_total_min IS NOT NULL), 1) AS tma_minutos,
  ROUND(AVG(avaliacao) FILTER (WHERE avaliacao IS NOT NULL), 1) AS nps_medio,
  user_id
FROM public.tickets
GROUP BY DATE(created_at), user_id;

-- View: kpi_por_atendente
CREATE OR REPLACE VIEW public.kpi_por_atendente AS
SELECT
  t.atendente_id,
  ap.nome_completo,
  ap.setor,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE t.status = 'ENCERRADO') AS encerrados,
  ROUND(AVG(t.tempo_resposta_min) FILTER (WHERE t.tempo_resposta_min IS NOT NULL), 1) AS tmr_medio,
  ROUND(AVG(t.tempo_total_min) FILTER (WHERE t.tempo_total_min IS NOT NULL), 1) AS tma_medio,
  COUNT(*) FILTER (WHERE t.sla_status = 'VIOLADO') AS violacoes_sla,
  ROUND(AVG(t.avaliacao) FILTER (WHERE t.avaliacao IS NOT NULL), 1) AS avaliacao_media,
  t.user_id
FROM public.tickets t
LEFT JOIN public.atendentes_perfil ap ON ap.id = t.atendente_id
WHERE t.atendente_id IS NOT NULL
GROUP BY t.atendente_id, ap.nome_completo, ap.setor, t.user_id;

-- Enable realtime for mensagens and tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
