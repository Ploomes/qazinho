import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { codexConfigFileOf } from '@/main/classes/agents/AgentRunner/library';

describe('codexConfigFileOf', () => {
  it("reads the config in .codex under the QA's home", () => {
    expect(codexConfigFileOf({ env: {}, home: '/Users/ana' })).toBe(
      join('/Users/ana', '.codex', 'config.toml'),
    );
  });

  it('follows CODEX_HOME when the QA moved it, and not when it is empty', () => {
    expect(
      codexConfigFileOf({ env: { CODEX_HOME: '/opt/codex' }, home: '/Users/ana' }),
    ).toBe(join('/opt/codex', 'config.toml'));
    expect(codexConfigFileOf({ env: { CODEX_HOME: '' }, home: '/Users/ana' })).toBe(
      join('/Users/ana', '.codex', 'config.toml'),
    );
  });
});
