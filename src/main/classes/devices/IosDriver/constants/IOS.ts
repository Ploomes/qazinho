/** A phone screen holds less than a page, and an accessibility tree holds more than a person reads. */
export const IOS = {
  screenTextLimit: 2_000,
  controlLimit: 40,
  labelLimit: 60,
  bootTimeoutMs: 180_000,
  commandTimeoutMs: 120_000,
  maxBufferBytes: 64 * 1024 * 1024,
  settleMs: 1_200,
  waitMs: 1_000,
  keys: {
    enter: '40',
    escape: '41',
    delete: '42',
    tab: '43',
    home: '227',
  } as Record<string, string>,
} as const;
