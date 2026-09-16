/** A run writes on every step, so the disk waits for the burst to settle. */
export const ARCHIVE = {
  settleMs: 700,
} as const;
