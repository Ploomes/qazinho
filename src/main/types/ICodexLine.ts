/** Uma linha de `codex exec --json`, restrita ao que o QAzinho lê. */
export interface ICodexLine {
  type: string;
  thread_id?: string;
  message?: string;
  item?: {
    type: string;
    text?: string;
    message?: string;
    command?: string;
    tool?: string;
    server?: string;
    arguments?: unknown;
  };
  usage?: { input_tokens?: number; cached_input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
}
