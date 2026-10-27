/**
 * How a run ended: it walked the whole plan, the QA stopped it, it broke on the way, or
 * QAzinho closed under it.
 */
export type RunEnd = 'finished' | 'stopped' | 'broke' | 'interrupted';
