/**
 * O `fetch`, restrito ao que o cliente da plataforma chama, para um teste entregar uma
 * plataforma fake.
 */
export type ProFetcher = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;
