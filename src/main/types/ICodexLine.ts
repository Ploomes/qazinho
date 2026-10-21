/** One line of `codex exec --json`, narrowed to what QAzinho reads. */
export interface ICodexLine {
  type: string;
  thread_id?: string;
  message?: string;
  item?: { type: string; text?: string; message?: string; command?: string };
  usage?: { input_tokens?: number; cached_input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
}
