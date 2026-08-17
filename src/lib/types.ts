export type Domain = "Faturamento" | "Pagamento" | "Outro";
export type Health = "saudavel" | "parcial" | "falha";
export type MessageRole = "user" | "lia";
/** How Lia sent the turn: webhook = automatic, atendente = live reply. */
export type MessageChannel = "webhook" | "atendente" | "outro";

export type Kpis = {
  executions_total: number;
  executions_15m: number;
  executions_1h: number;
  conversations_total: number;
  conversations_live: number;
  success_lia_pct: number;
  success_meta_pct: number;
  delivered_pct: number;
  operators_active: number;
  messages_total: number;
  /** Outbound replies sent by Lia (automatic + live agent). */
  lia_messages_total: number;
  /** Executions with a confirmed WhatsApp delivery id. */
  deliveries_total: number;
  executions_faturamento: number;
  executions_pagamento: number;
  talks_faturamento: number;
  talks_pagamento: number;
  talks_webhook: number;
  talks_atendente: number;
  computed_at: string;
};

export type Execution = {
  execution_id: string | null;
  conversation_id: string | null;
  workflow_name: string | null;
  created_at: string | null;
  holmes_user: string | null;
  execution_status_lia: string | null;
  execution_status_meta: string | null;
  send_wa_masked: string | null;
  delivered: boolean | null;
  domain: Domain;
  health: Health;
};

export type Conversation = {
  conversation_id: string;
  operator_name: string;
  domain: Domain;
  started_at: string | null;
  last_at: string | null;
  turns: number;
  last_user_msg: string | null;
  last_lia_msg: string | null;
  executions_count: number;
  success_lia_pct: number;
  success_meta_pct: number;
  delivered_pct: number;
  has_delivered: boolean;
  is_live: boolean;
};

export type Message = {
  message_id: string;
  conversation_id: string;
  execution_id: string | null;
  holmes_author: string | null;
  domain: Domain;
  created_at: string | null;
  role: MessageRole;
  body: string;
  sort_key: number;
  channel: MessageChannel;
};

export type OperatorStats = {
  name: string;
  conversations: number;
  executions: number;
  turns: number;
  last_at: string | null;
  share: number;
};
