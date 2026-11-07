import type { OutsideToolCall } from '@/shared/types';
import { OUTSIDE_CHANGES } from '@/modules/Outside/constants';

/** Se uma chamada de fora muda o que o QA tem, e não só lê ou roda. */
export function isOutsideChange(
  call: OutsideToolCall,
): call is Extract<OutsideToolCall, { name: (typeof OUTSIDE_CHANGES)[number] }> {
  return OUTSIDE_CHANGES.some((name) => name === call.name);
}
