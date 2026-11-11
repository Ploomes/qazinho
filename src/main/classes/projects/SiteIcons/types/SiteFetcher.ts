/** O `fetch` que a busca de um ícone usa, para um teste entregar um site fake. */
export type SiteFetcher = (
  url: string,
  init: { signal: AbortSignal; headers: Record<string, string> },
) => Promise<{
  ok: boolean;
  headers: { get: (name: string) => string | null };
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
}>;
