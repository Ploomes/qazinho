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

  it('keeps that the coding agent wrote it, and leaves the mark off what the QA typed', () => {
    const [byAgent] = appendUserMessage({
      workspace: makeWorkspace(),
      text: 'Plan it',
      at: '19:54',
      from: 'agent',
    }).chat;
    const [byQa] = appendUserMessage({
      workspace: makeWorkspace(),
      text: 'Plan it',
      at: '19:54',
    }).chat;

    expect(byAgent).toMatchObject({ from: 'agent' });
    expect(byQa).not.toHaveProperty('from');
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

  it('keeps the mentions it carried, so they stand out when the chat is read again', () => {
    const workspace = appendUserMessage({
      workspace: makeWorkspace(),
      text: 'What happened in @r-02?',
      at: '19:54',
      mentions: ['r-02'],
    });

    expect(workspace.chat[0]).toMatchObject({ mentions: ['r-02'] });
  });

  it('does NOT write an empty mention list on a plain message', () => {
    const workspace = appendUserMessage({
      workspace: makeWorkspace(),
      text: 'hello',
      at: '19:54',
    });

    expect(workspace.chat[0]).not.toHaveProperty('mentions');
  });

  it('keeps the command the QA gave, even with no words of theirs', () => {
    const command = {
      id: 'code-plan' as const,
      repository: 'acme/loja-web',
      branch: 'feat/cupom',
      base: 'develop',
    };
    const workspace = appendUserMessage({
      workspace: makeWorkspace(),
      text: '  ',
      at: '19:54',
      command,
    });

    expect(workspace.chat[0]).toMatchObject({ kind: 'user', text: '', command });
  });
});
