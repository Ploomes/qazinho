import { passwordsIn } from './passwordsIn';
import { tokenIn } from './tokenIn';

/** The first token or written-out password in a message, which the agent would read; null when there is none. */
export function secretIn(text: string): string | null {
  return tokenIn(text) ?? passwordsIn(text)[0] ?? null;
}
