/** `fetch`, narrowed to what QAzinho asks of Jira, so a test hands in a fake site. */
export type JiraFetcher = (
  url: string,
  init: {
    method?: 'GET' | 'POST' | 'PUT';
    headers: Record<string, string>;
    body?: string | FormData;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  arrayBuffer: () => Promise<ArrayBuffer>;
}>;
