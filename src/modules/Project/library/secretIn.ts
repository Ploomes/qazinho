import { passwordsIn } from './passwordsIn';
import { tokenIn } from './tokenIn';

/**
 * O primeiro token ou senha escrita numa mensagem, que o agente leria; null quando não há
 * nenhum.
 */
export function secretIn(text: string): string | null {
  return tokenIn(text) ?? passwordsIn(text)[0] ?? null;
}
