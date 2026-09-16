/** One line of the agent CLI's stream-json output, narrowed to what gocrash reads. */
export interface IAgentLine {
  type: string;
  subtype?: string;
  session_id?: string;
  result?: string;
  is_error?: boolean;
  message?: {
    content?: { type: string; text?: string; name?: string; input?: unknown }[];
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
}
