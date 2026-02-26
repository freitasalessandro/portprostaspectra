export {
  useTickets,
  useMensagens,
  useMotivos,
  useAtendentePerfil,
  useForwardNotification,
  useOpenTicketCount,
  useNewTicketNotification,
  cargoLabels,
  cargoColors,
} from "./useAtendimento";

export type {
  Contato,
  Ticket,
  Mensagem,
  Motivo,
  AtendenteCargo,
  AtendentePerfil,
} from "./useAtendimento";

export { useNotificationSound } from "./useNotificationSound";
