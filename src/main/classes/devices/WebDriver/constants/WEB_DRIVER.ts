export const WEB_DRIVER = {
  viewport: { width: 1280, height: 800 },
  waitMs: 1_000,
  streamQuality: 70,
  actionTimeoutMs: 5_000,
  gotoTimeoutMs: 15_000,
  settleMs: 2_000,
  pageTextLimit: 2_000,
  elementLimit: 40,
} as const;
