/** O `fetch`, restrito ao que o cofre chama, para um teste entregar um tracker fake. */
export type Fetcher = (
  url: string,
  init: { headers: Record<string, string> },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;
