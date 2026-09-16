import { describe, expect, it } from 'vitest';
import { appendAgentMessage } from '@/modules/Chat/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

describe('appendAgentMessage', () => {
  it('signs the message with the agent that said it', () => {
    const workspace = appendAgentMessage({
      workspace: makeWorkspace(),
      text: 'I closed the cookie banner first.',
      who: 'Codex',
      at: '09:41',
    });

    expect(workspace.chat.at(-1)).toMatchObject({
      kind: 'agent',
      who: 'Codex',
      text: 'I closed the cookie banner first.',
    });
  });

  it('does NOT add an empty message when the agent said nothing', () => {
    const before = makeWorkspace();

    expect(
      appendAgentMessage({ workspace: before, text: '  ', who: 'Codex', at: '09:41' }),
    ).toBe(before);
  });
});
