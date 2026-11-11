import type { IDetectedAgent } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { walkedByOf } from '@/modules/Run/library';

const CLAUDE: IDetectedAgent = {
  id: 'claude-code',
  name: 'Claude Code',
  command: 'claude',
  isFound: true,
  path: '/usr/local/bin/claude',
  defaultModel: 'claude-sonnet-4-5',
  isSignedIn: true,
};

describe('walkedByOf', () => {
  it('names the model picked the way the model menu does', () => {
    expect(
      walkedByOf({
        agent: 'Claude Code',
        model: 'haiku',
        targetKind: 'ios',
        agents: [CLAUDE],
      }),
    ).toEqual({ agent: 'Claude Code', modelName: 'Haiku', targetKind: 'ios' });
  });

  it("names the model the agent's own config picks when the QA left it to the agent", () => {
    expect(
      walkedByOf({ agent: 'Claude Code', model: '', targetKind: 'web', agents: [CLAUDE] })
        .modelName,
    ).toBe('Sonnet 4.5');
  });

  it('says nothing of a model nobody named, rather than guess one', () => {
    expect(
      walkedByOf({ agent: 'Codex', model: '', targetKind: 'web', agents: [CLAUDE] })
        .modelName,
    ).toBeNull();
  });
});
