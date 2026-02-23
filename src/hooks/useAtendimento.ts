import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Contato {
  id: string;
  whatsapp_number: string;
  nome: string | null;
  email: string | null;
  empresa: string | null;
  notas: string | null;
  total_tickets: number;
}

export interface Ticket {
  id: string;
  numero: number;
  contato_id: string;
  whatsapp_number: string;
  motivo_id: string | null;
  atendente_id: string | null;
  status: string;
  sla_status: string;
  protocolo: string;
  tags: string[];
  avaliacao: number | null;
  created_at: string;
  assumed_at: string | null;
  first_response_at: string | null;
  closed_at: string | null;
  sla_deadline: string | null;
  tempo_total_min: number | null;
  tempo_resposta_min: number | null;
  user_id: string;
  contato?: Contato;
  ultima_mensagem?: string;
  ultima_mensagem_at?: string;
}

export interface Mensagem {
  id: string;
  ticket_id: string;
  evolution_id: string | null;
  sentido: string;
  tipo: string;
  conteudo: string | null;
  midia_url: string | null;
  atendente_id: string | null;
  assinatura: string | null;
  status_envio: string | null;
  timestamp_wa: string | null;
  created_at: string;
}

export interface Motivo {
  id: string;
  nome: string;
  descricao: string | null;
  sla_minutos: number;
  prioridade: string;
  cor_hex: string;
  ativo: boolean;
}

export interface AtendentePerfil {
  id: string;
  nome_completo: string;
  setor: string | null;
  assinatura_padrao: string | null;
  assinatura_ativa: boolean;
  max_tickets: number;
  disponivel: boolean;
}

export function useTickets(filter: string = "minha_fila") {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const fetchTickets = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    let query = supabase
      .from("tickets")
      .select("*, contatos(*)")
      .order("created_at", { ascending: false });

    switch (filter) {
      case "minha_fila":
        query = query.eq("atendente_id", userId).in("status", ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO"]);
        break;
      case "todos":
        query = query.in("status", ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO"]);
        break;
      case "aguardando":
        query = query.eq("status", "AGUARDANDO");
        break;
      case "encerrados":
        query = query.eq("status", "ENCERRADO").limit(50);
        break;
    }

    const { data, error } = await query;
    if (!error && data) {
      const ticketsWithContato = data.map((t: any) => ({
        ...t,
        contato: t.contatos,
        tags: t.tags || [],
      }));
      setTickets(ticketsWithContato);
    }
    setLoading(false);
  }, [userId, filter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("tickets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => {
        fetchTickets();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

  return { tickets, loading, refetch: fetchTickets, userId };
}

export function useMensagens(ticketId: string | null) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMensagens = useCallback(async () => {
    if (!ticketId) { setMensagens([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("mensagens")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (data) setMensagens(data as Mensagem[]);
    setLoading(false);
  }, [ticketId]);

  useEffect(() => { fetchMensagens(); }, [fetchMensagens]);

  // Realtime
  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`mensagens-${ticketId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "mensagens",
        filter: `ticket_id=eq.${ticketId}`,
      }, (payload) => {
        setMensagens(prev => [...prev, payload.new as Mensagem]);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "mensagens",
        filter: `ticket_id=eq.${ticketId}`,
      }, (payload) => {
        setMensagens(prev => prev.map(m => m.id === (payload.new as Mensagem).id ? payload.new as Mensagem : m));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId]);

  return { mensagens, loading, refetch: fetchMensagens };
}

export function useMotivos() {
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("motivos_atendimento")
      .select("*")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => {
        if (data) setMotivos(data as Motivo[]);
        setLoading(false);
      });
  }, []);

  return { motivos, loading };
}

export function useAtendentePerfil() {
  const [perfil, setPerfil] = useState<AtendentePerfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase
        .from("atendentes_perfil")
        .select("*")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (p) setPerfil(p as AtendentePerfil);
      setLoading(false);
    });
  }, []);

  const updatePerfil = async (updates: Partial<AtendentePerfil>) => {
    if (!perfil) return;
    const { error } = await supabase
      .from("atendentes_perfil")
      .update(updates)
      .eq("id", perfil.id);
    if (!error) setPerfil(prev => prev ? { ...prev, ...updates } : prev);
    return error;
  };

  return { perfil, loading, updatePerfil };
}

export function useOpenTicketCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { count: c } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["ABERTO", "AGUARDANDO"]);
      setCount(c || 0);
    };
    fetch();

    const channel = supabase
      .channel("ticket-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return count;
}
