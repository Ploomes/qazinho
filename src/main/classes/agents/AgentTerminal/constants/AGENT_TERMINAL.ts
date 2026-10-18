export const AGENT_TERMINAL = {
  expect: '/usr/bin/expect',
  height: 50,
  width: 160,
  relayFile: 'qazinho-terminal-relay.exp',
  lookMs: 50,
  settleMs: 120,
  staleMs: 600,
  keyMs: 1_500,
  maxPendingChars: 4_096,
} as const;
