export const REPLAY_COMPOSER = {
  codecs: ['avc1.640028', 'avc1.640033'],
  acceleration: ['prefer-hardware', 'no-preference'],
  bitrate: 2_500_000,
  frameRate: 10,
  stepUs: 100_000,
  keyEveryUs: 2_000_000,
  queueLimit: 6,
  waitMs: 20,
  progressStep: 0.01,
  fonts: ['400 11px "Geist Mono"', '500 11px "Geist Mono"', '700 10px "Geist Mono"'],
} as const;
