import { createHash } from 'node:crypto';

/**
 * Uma impressão digital do que um corpo diz, para distinguir um corpo já enviado de um
 * que mudou.
 */
export function hashOf(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
