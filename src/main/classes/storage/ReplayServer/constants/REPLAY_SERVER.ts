export const REPLAY_SERVER = {
  host: '127.0.0.1',
  types: { '.mp4': 'video/mp4', '.webm': 'video/webm' } as Record<string, string>,
} as const;
