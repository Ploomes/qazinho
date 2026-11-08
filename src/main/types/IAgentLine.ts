/** Uma linha da saída stream-json da CLI do agente, restrita ao que o QAzinho lê. */
export interface IAgentLine {
  type: string;
  subtype?: string;
  session_id?: string;
  parent_tool_use_id?: string | null;
  result?: string;
  is_error?: boolean;
  message?: {
    content?: { type: string; text?: string; name?: string; input?: unknown }[];
  };
  event?: {
    type: string;
    content_block?: { type: string; name?: string };
    delta?: { type: string; text?: string; partial_json?: string };
  };
  rate_limit_info?: {
    resetsAt?: number;
    unifiedWindows?: {
      five_hour?: { utilization?: number; resetsAt?: number };
      seven_day?: { utilization?: number };
    };
  };
  usage?: { input_tokens?: number; cache_read_input_tokens?: number };
  modelUsage?: Record<string, { contextWindow?: number }>;
  total_cost_usd?: number;
  attempt?: number;
  max_retries?: number;
}
