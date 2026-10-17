/** The agents QAzinho knows how to drive, the binary each installs, and where it keeps its default model. */
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
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    command: 'gemini',
    config: { file: '.gemini/settings.json', format: 'json' },
  },
] as const;
