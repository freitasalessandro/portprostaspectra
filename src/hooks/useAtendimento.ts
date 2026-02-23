import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSound } from "@/hooks/useNotificationSound";

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [encerradosCount, setEncerradosCount] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);

  const PAGE_SIZE = 30;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const enrichTickets = async (data: any[]): Promise<Ticket[]> => {
    if (data.length === 0) return [];
    const ticketIds = data.map((t: any) => t.id);
    const { data: lastMsgs } = await supabase
      .from("mensagens")
      .select("ticket_id, conteudo, tipo, created_at")
      .in("ticket_id", ticketIds)
      .order("created_at", { ascending: false });

    const lastMsgMap: Record<string, { conteudo: string | null; tipo: string; created_at: string }> = {};
    if (lastMsgs) {
      for (const m of lastMsgs) {
        if (!lastMsgMap[m.ticket_id]) lastMsgMap[m.ticket_id] = m;
      }
    }

    return data.map((t: any) => {
      const lm = lastMsgMap[t.id];
      return {
        ...t,
        contato: t.contatos,
        tags: t.tags || [],
        ultima_mensagem: lm ? (lm.tipo !== "TEXT" ? `📎 ${lm.tipo.toLowerCase()}` : lm.conteudo) : null,
        ultima_mensagem_at: lm?.created_at || null,
      };
    });
  };

  const buildQuery = () => {
    let query = supabase
      .from("tickets")
      .select("*, contatos(*)")
      .order("created_at", { ascending: false });

    switch (filter) {
      case "minha_fila":
        query = query.eq("atendente_id", userId!).in("status", ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO"]);
        break;
      case "todos":
        query = query.in("status", ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO"]);
        break;
      case "aguardando":
        query = query.eq("status", "AGUARDANDO");
        break;
      case "encerrados":
        query = query.eq("status", "ENCERRADO");
        break;
    }
    return query;
  };

  const fetchTickets = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setHasMore(false);

    // Fetch encerrados count in parallel
    const countPromise = supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "ENCERRADO");

    const query = buildQuery().range(0, PAGE_SIZE - 1);
    const [{ data, error }, { count }] = await Promise.all([query, countPromise]);

    setEncerradosCount(count ?? 0);

    if (!error && data) {
      const enriched = await enrichTickets(data);
      setTickets(enriched);
      setHasMore(filter === "encerrados" && data.length === PAGE_SIZE);
    } else if (!error) {
      setTickets([]);
    }
    setLoading(false);
  }, [userId, filter]);

  const fetchMore = useCallback(async () => {
    if (!userId || loadingMore || !hasMore) return;
    setLoadingMore(true);

    const offset = tickets.length;
    const query = buildQuery().range(offset, offset + PAGE_SIZE - 1);
    const { data, error } = await query;

    if (!error && data) {
      const enriched = await enrichTickets(data);
      setTickets(prev => [...prev, ...enriched]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoadingMore(false);
  }, [userId, tickets.length, loadingMore, hasMore, filter]);

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

  return { tickets, loading, loadingMore, hasMore, encerradosCount, refetch: fetchTickets, fetchMore, userId };
}

export function useMensagens(ticketId: string | null) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);
  const playSound = useNotificationSound();

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
        const newMsg = payload.new as Mensagem;
        setMensagens(prev => [...prev, newMsg]);
        // Play sound for incoming messages
        if (newMsg.sentido === "ENTRADA") {
          playSound();
        }
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
  }, [ticketId, playSound]);

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
      if (p) {
        setPerfil(p as AtendentePerfil);
      } else {
        // Auto-create profile if it doesn't exist
        const displayName = data.user.email?.split("@")[0] || "Atendente";
        const { data: created } = await supabase
          .from("atendentes_perfil")
          .insert({
            id: data.user.id,
            user_id: data.user.id,
            nome_completo: displayName,
            setor: null,
            assinatura_padrao: null,
            assinatura_ativa: false,
          })
          .select()
          .single();
        if (created) setPerfil(created as AtendentePerfil);
      }
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
