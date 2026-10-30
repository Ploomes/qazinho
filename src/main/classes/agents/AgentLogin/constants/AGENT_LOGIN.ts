export const AGENT_LOGIN = {
  signInMs: 5 * 60_000,
  headsUpMs: 3_000,
  pollMs: 1_500,
  scriptName: 'qazinho-agent-login',
  scriptExtensions: { darwin: '.command', win32: '.cmd', other: '.sh' },
  say: 'QAzinho: sign in on the page this opens in your browser. QAzinho notices once you are in, and you can close this window.',
} as const;
