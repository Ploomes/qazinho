export const AGENT_PROBES = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    command: 'claude',
    config: { file: '.claude/settings.json', format: 'json' },
  },
  {
    id: 'codex',
    name: 'Codex',
    command: 'codex',
    config: { file: '.codex/config.toml', format: 'toml' },
  },
] as const;
