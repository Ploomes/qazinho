import type { Fetcher } from '@/main/classes/integrations/IntegrationVault/types';

/** Um tracker que responde todo pedido do mesmo jeito, e lembra o que lhe perguntaram. */
export function fakeTracker(answer: { status: number; body: unknown } | 'offline') {
  const asked: { url: string; headers: Record<string, string> }[] = [];
  const fetcher: Fetcher = (url, init) => {
    asked.push({ url, headers: init.headers });

    if (answer === 'offline') return Promise.reject(new Error('ENOTFOUND'));

    return Promise.resolve({
      ok: answer.status >= 200 && answer.status < 300,
      status: answer.status,
      json: () => Promise.resolve(answer.body),
    });
  };

  return { fetcher, asked };
}
