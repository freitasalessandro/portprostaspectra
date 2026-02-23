
-- Fix security definer views by recreating with security_invoker = on
DROP VIEW IF EXISTS public.kpi_dashboard;
DROP VIEW IF EXISTS public.kpi_por_atendente;

CREATE OR REPLACE VIEW public.kpi_dashboard WITH (security_invoker = on) AS
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

CREATE OR REPLACE VIEW public.kpi_por_atendente WITH (security_invoker = on) AS
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
