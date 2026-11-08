import type { MemoryOp } from './MemoryOp';

/** O que o agente pediu para mudar no que guarda, ou que ele não respondeu. */
export type MemoryKeeping = { isKept: true; ops: MemoryOp[] } | { isKept: false };
