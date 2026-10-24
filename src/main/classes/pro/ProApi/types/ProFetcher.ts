/** `fetch`, narrowed to what the platform's client calls, so a test hands in a fake platform. */
export type ProFetcher = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;
