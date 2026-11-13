export const PHONE_PEEK = {
  keepMs: 10 * 60_000,
  settleMs: 1_500,
  reasons: {
    busy: 'a run is using the device now',
    android: 'this machine has no Android emulator',
    ios: 'this machine has no iOS simulator with AXe',
  },
} as const;
