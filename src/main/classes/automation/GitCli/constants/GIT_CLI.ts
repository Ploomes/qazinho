export const GIT_CLI = {
  timeoutMs: 60_000,
  saidChars: 600,
  env: {
    GIT_TERMINAL_PROMPT: '0',
    GIT_OPTIONAL_LOCKS: '0',
    LC_ALL: 'C',
  },
} as const;
