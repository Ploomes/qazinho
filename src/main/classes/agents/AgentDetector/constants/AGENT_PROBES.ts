export const AGENT_PROBES = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    command: 'claude',
    config: { file: '.claude/settings.json', format: 'json' },
    status: { args: ['auth', 'status'], reads: 'claude' },
  },
  {
    id: 'codex',
    name: 'Codex',
    command: 'codex',
    config: { file: '.codex/config.toml', format: 'toml' },
    status: { args: ['login', 'status'], reads: 'codex' },
  },
] as const;
