export const BUG_FILING = {
  label: 'bug',
  recordingMaxBytes: 25 * 1024 * 1024,
  types: {
    png: 'image/png',
    jpg: 'image/jpeg',
    mp4: 'video/mp4',
    webm: 'video/webm',
  },
} as const;
