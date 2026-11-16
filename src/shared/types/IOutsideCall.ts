import type { OutsideCaller } from './OutsideCaller';
import type { OutsideToolCall } from './OutsideToolCall';

/** A chamada de um agente de fora, com o agente de código que a fez. */
export type IOutsideCall = OutsideToolCall & { caller: OutsideCaller };
