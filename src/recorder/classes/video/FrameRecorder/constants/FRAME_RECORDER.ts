export const FRAME_RECORDER = {
  codec: 'avc1.640028',
  bitrate: 1_500_000,
  frameRate: 10,
  minGapMs: 100,
  keyEveryMs: 2_000,
  maxSide: 1280,
  chunkBytes: 1_048_576,
  letterbox: '#0e0e0e',
} as const;
