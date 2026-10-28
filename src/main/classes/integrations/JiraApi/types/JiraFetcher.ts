/**
 * O `fetch`, restrito ao que o QAzinho pede ao Jira, para um teste entregar um site fake.
 */
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
