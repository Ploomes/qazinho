/** What each kind of process costs. Real numbers arrive when the processes do. */
export const RESOURCES = {
  ramCeilingGb: 32,
  agent: { cpu: 4, ramGb: 0.42 },
  browser: { cpu: 12, ramGb: 1.8 },
  emulator: { cpu: 11, ramGb: 4.4 },
} as const;
