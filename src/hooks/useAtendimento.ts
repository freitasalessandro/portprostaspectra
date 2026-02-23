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
  atendente_nome?: string;
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

export type AtendenteCargo = "n1_triagem" | "n2_tecnico" | "supervisor";

export const cargoLabels: Record<AtendenteCargo, string> = {
  n1_triagem: "N1 · Triagem",
  n2_tecnico: "N2 · Técnico",
  supervisor: "Supervisor",
};

export const cargoColors: Record<AtendenteCargo, string> = {
  n1_triagem: "bg-sky-500/15 text-sky-400 border-sky-500/25",
  n2_tecnico: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  supervisor: "bg-amber-500/15 text-amber-400 border-amber-500/25",
};

export interface AtendentePerfil {
  id: string;
  nome_completo: string;
  setor: string | null;
  assinatura_padrao: string | null;
  assinatura_ativa: boolean;
  max_tickets: number;
  disponivel: boolean;
  cargo: AtendenteCargo;
}

export function useTickets(filter: string = "minha_fila", cargo?: AtendenteCargo) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
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
    const atendenteIds = [...new Set(data.map((t: any) => t.atendente_id).filter(Boolean))];

    const [{ data: lastMsgs }, { data: atendentes }] = await Promise.all([
      supabase
        .from("mensagens")
        .select("ticket_id, conteudo, tipo, created_at")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: false }),
      atendenteIds.length > 0
        ? supabase.from("atendentes_perfil").select("user_id, nome_completo").in("user_id", atendenteIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const lastMsgMap: Record<string, { conteudo: string | null; tipo: string; created_at: string }> = {};
    if (lastMsgs) {
      for (const m of lastMsgs) {
        if (!lastMsgMap[m.ticket_id]) lastMsgMap[m.ticket_id] = m;
      }
    }

    const atendenteMap: Record<string, string> = {};
    if (atendentes) {
      for (const a of atendentes) {
        atendenteMap[a.user_id] = a.nome_completo;
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
        atendente_nome: t.atendente_id ? atendenteMap[t.atendente_id] || null : null,
      };
    });
  };

  const buildQuery = () => {
    let query = supabase
      .from("tickets")
      .select("*, contatos(*)")
      .order("created_at", { ascending: false });

    const activeStatuses = ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO"] as const;

    switch (filter) {
      case "minha_fila":
        if (cargo === "supervisor") {
          // Supervisors see all active tickets
          query = query.in("status", activeStatuses);
        } else if (cargo === "n1_triagem") {
          // N1 sees unassigned + own tickets
          query = query.in("status", activeStatuses).or(`atendente_id.is.null,atendente_id.eq.${userId}`);
        } else {
          // N2 and default: only own tickets
          query = query.eq("atendente_id", userId!).in("status", activeStatuses);
        }
        break;
      case "todos":
        if (cargo === "n1_triagem") {
          // N1 only sees unassigned in "todos"
          query = query.in("status", activeStatuses).is("atendente_id", null);
        } else if (cargo === "supervisor") {
          // Supervisor sees tickets assigned to others (not self) + unassigned
          query = query.in("status", activeStatuses).or(`atendente_id.is.null,atendente_id.neq.${userId}`);
        } else {
          // N2 sees all tickets not assigned to self
          query = query.in("status", activeStatuses).neq("atendente_id", userId!);
        }
        break;
      case "aguardando":
        query = query.eq("status", "AGUARDANDO");
        if (cargo === "n1_triagem") {
          query = query.or(`atendente_id.is.null,atendente_id.eq.${userId}`);
        }
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

    // Fetch all tab counts in parallel (respecting cargo permissions)
    const activeStatuses = ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO"] as const;
    
    // "Minha Fila" count
    let minhaFilaQuery = supabase.from("tickets").select("id", { count: "exact", head: true }).in("status", activeStatuses);
    if (cargo === "supervisor") {
      // supervisor sees all
    } else if (cargo === "n1_triagem") {
      minhaFilaQuery = minhaFilaQuery.or(`atendente_id.is.null,atendente_id.eq.${userId}`);
    } else {
      minhaFilaQuery = minhaFilaQuery.eq("atendente_id", userId!);
    }

    // "Todos" count (excludes own tickets to avoid overlap with "Minha Fila")
    let todosQuery = supabase.from("tickets").select("id", { count: "exact", head: true }).in("status", activeStatuses);
    if (cargo === "n1_triagem") {
      todosQuery = todosQuery.is("atendente_id", null);
    } else if (cargo === "supervisor") {
      todosQuery = todosQuery.or(`atendente_id.is.null,atendente_id.neq.${userId}`);
    } else {
      todosQuery = todosQuery.neq("atendente_id", userId!);
    }

    // "Aguardando" count
    let aguardandoQuery = supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "AGUARDANDO");
    if (cargo === "n1_triagem") {
      aguardandoQuery = aguardandoQuery.or(`atendente_id.is.null,atendente_id.eq.${userId}`);
    }

    const countQueries = [
      minhaFilaQuery,
      todosQuery,
      aguardandoQuery,
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "ENCERRADO"),
    ];

    const query = buildQuery().range(0, PAGE_SIZE - 1);
    const [{ data, error }, ...countResults] = await Promise.all([query, ...countQueries]);

    setTabCounts({
      minha_fila: countResults[0].count ?? 0,
      todos: countResults[1].count ?? 0,
      aguardando: countResults[2].count ?? 0,
      encerrados: countResults[3].count ?? 0,
    });

    if (!error && data) {
      const enriched = await enrichTickets(data);
      setTickets(enriched);
      setHasMore(filter === "encerrados" && data.length === PAGE_SIZE);
    } else if (!error) {
      setTickets([]);
    }
    setLoading(false);
  }, [userId, filter, cargo]);

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

  return { tickets, loading, loadingMore, hasMore, tabCounts, refetch: fetchTickets, fetchMore, userId };
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

export function useForwardNotification(perfilId: string | null) {
  const playSound = useNotificationSound();
  const { toast } = useToast();

  useEffect(() => {
    if (!perfilId) return;

    const channel = supabase
      .channel(`forward-notify-${perfilId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "tickets",
        filter: `atendente_id=eq.${perfilId}`,
      }, (payload) => {
        const oldAtendente = (payload.old as any)?.atendente_id;
        const newAtendente = (payload.new as any)?.atendente_id;
        if (newAtendente === perfilId && oldAtendente !== perfilId) {
          playSound();
          toast({
            title: "📋 Ticket encaminhado para você",
            description: `Ticket #${(payload.new as any).protocolo || (payload.new as any).numero} foi atribuído a você.`,
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [perfilId, playSound, toast]);
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

export function useNewTicketNotification(userId: string | null, cargo?: AtendenteCargo) {
  const playSound = useNotificationSound();
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`new-ticket-notify-${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "tickets",
      }, (payload) => {
        const newTicket = payload.new as any;
        // Notify if ticket is relevant to this agent's queue
        const isRelevant =
          cargo === "supervisor" || // supervisors see all
          cargo === "n1_triagem" || // N1 sees unassigned (new tickets have no atendente)
          newTicket.atendente_id === userId; // directly assigned

        if (isRelevant && newTicket.status === "ABERTO") {
          playSound();
          toast({
            title: "🆕 Novo ticket na fila",
            description: `Ticket #${newTicket.protocolo || newTicket.numero} — novo atendimento aberto.`,
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, cargo, playSound, toast]);
}
