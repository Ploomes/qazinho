import { describe, expect, it } from 'vitest';
import { appendUserMessage } from '@/modules/Chat/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

describe('appendUserMessage', () => {
  it('puts what the QA typed at the end of the chat, stamped with the time', () => {
    const workspace = appendUserMessage({
      workspace: makeWorkspace(),
      text: 'Test the whole checkout',
      at: '19:54',
    });

    expect(workspace.chat).toHaveLength(1);
    expect(workspace.chat[0]).toMatchObject({
      kind: 'user',
      text: 'Test the whole checkout',
      at: '19:54',
    });
  });

  it('does NOT send an empty message', () => {
    const workspace = makeWorkspace();

    expect(appendUserMessage({ workspace, text: '   ', at: '19:54' })).toBe(workspace);
  });

  it('trims what was typed, so the bubble does not carry stray spaces', () => {
    const workspace = appendUserMessage({
      workspace: makeWorkspace(),
      text: '  hello  ',
      at: '19:54',
    });

    expect(workspace.chat[0]).toMatchObject({ text: 'hello' });
  });
});
