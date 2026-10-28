const MINUTE_MS = 60_000;
const EARLY_SHARE = 1 / 3;

/**
 * O que dizer a um explorador que quer terminar com mais de um terço do tempo sobrando,
 * ou null quando ele pode terminar.
 */
export function earlyFinish(props: { leftMs: number; totalMs: number }): string | null {
  const { leftMs, totalMs } = props;

  if (leftMs <= totalMs * EARLY_SHARE) return null;

  const minutes = Math.max(1, Math.round(leftMs / MINUTE_MS));

  return `About ${String(minutes)} minute${minutes === 1 ? ' is' : 's are'} still left: use ${minutes === 1 ? 'it' : 'them'}. Try what you have not yet, such as the flows you did not take to the end, the edges of each field, every control and screen you have not used, and each sum the app works out, done again by you. When a sign-in or a code stands in your way, ask the QA for it with ask_qa. Then call finish again.`;
}
