/** `fetch`, narrowed to what the vault calls, so a test hands in a fake tracker. */
export type Fetcher = (
  url: string,
  init: { headers: Record<string, string> },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;
