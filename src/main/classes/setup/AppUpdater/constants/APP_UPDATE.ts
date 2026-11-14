export const APP_UPDATE = {
  firstCheckMs: 5_000,
  everyMs: 4 * 60 * 60 * 1000,
  requiredEveryMs: 60_000,
  installWaitMs: 30_000,
  storeUpdates: 'ms-windows-store://downloadsandupdates',
} as const;
