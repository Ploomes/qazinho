/** A live run counts its own seconds, so the QA sees time pass between two slow steps. */
export const RUN_CLOCK = {
  tickMs: 1_000,
} as const;
