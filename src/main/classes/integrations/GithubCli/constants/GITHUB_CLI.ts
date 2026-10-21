export const GITHUB_CLI = {
  host: 'github.com',
  scopes: ['repo', 'read:org'],
  deviceUrl: 'https://github.com/login/device',
  apiTimeoutMs: 60_000,
  downloadTimeoutMs: 10 * 60_000,
  signInMs: 15 * 60_000,
  saidChars: 600,
  env: {
    GH_PROMPT_DISABLED: '1',
    GH_NO_UPDATE_NOTIFIER: '1',
    GH_SPINNER_DISABLED: '1',
    NO_COLOR: '1',
  },
} as const;
