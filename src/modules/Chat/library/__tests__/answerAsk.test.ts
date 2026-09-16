import { describe, expect, it } from 'vitest';
import { answerAsk, replyToQa } from '@/modules/Chat/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

const WAITING = replyToQa({ workspace: makeWorkspace([]), kind: 'mobile', at: '19:54' });

describe('answerAsk', () => {
  it('takes the question off the chat once it is answered', () => {
    const workspace = answerAsk({
      workspace: WAITING,
      reply: 'Use the sandbox number.',
      at: '19:56',
    });

    expect(workspace.chat.some(({ kind }) => kind === 'ask')).toBe(false);
  });

  it('leaves the answer and the acknowledgement in the conversation', () => {
    const workspace = answerAsk({
      workspace: WAITING,
      reply: 'Use the sandbox number.',
      at: '19:56',
    });

    expect(workspace.chat.at(-2)).toMatchObject({
      kind: 'user',
      text: 'Use the sandbox number.',
    });
    expect(workspace.chat.at(-1)).toMatchObject({ kind: 'agent' });
  });

  it('lets the workspace go quiet again, so the sidebar stops shouting', () => {
    const workspace = answerAsk({
      workspace: WAITING,
      reply: 'Skip that case.',
      at: '19:56',
    });

    expect(workspace.status).toBe('idle');
  });
});
