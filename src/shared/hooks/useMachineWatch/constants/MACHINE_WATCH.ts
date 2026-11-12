export const MACHINE_WATCH = {
  pollMs: 3_000,
  limitsMs: 15 * 60 * 1_000,
  limitsWorkingMs: 5 * 60 * 1_000,
  limitsTickMs: 30 * 1_000,
  workingMs: 2 * 60 * 1_000,
} as const;
