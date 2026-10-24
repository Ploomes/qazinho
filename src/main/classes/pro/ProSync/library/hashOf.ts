import { createHash } from 'node:crypto';

/** A fingerprint of what a body says, to tell a body already sent from one that changed. */
export function hashOf(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
