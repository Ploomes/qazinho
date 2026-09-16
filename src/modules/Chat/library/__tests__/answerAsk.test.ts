import type { IWorkspace } from '@/modules/Workspace/types';
import { describe, expect, it } from 'vitest';
import { answerAsk } from '@/modules/Chat/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

function waiting(): IWorkspace {
  return {
    ...makeWorkspace(),
    status: 'attention',
    chat: [
      {
        id: 'm-1',
        kind: 'ask',
        at: '19:54',
        text: 'Which phone number should I use?',
        holdingFor: '4m 12s',
        options: [
          {
            label: 'Use the sandbox number',
            reply: 'Use the sandbox number.',
            isPrimary: true,
          },
        ],
      },
    ],
  };
}

describe('answerAsk', () => {
  it('takes the question off the chat once it is answered', () => {
    const workspace = answerAsk({
      workspace: waiting(),
      reply: 'Use the sandbox number.',
      at: '19:56',
    });

    expect(workspace.chat.some(({ kind }) => kind === 'ask')).toBe(false);
  });

  it('leaves the answer in the conversation, and puts no words in the agent mouth', () => {
    const workspace = answerAsk({
      workspace: waiting(),
      reply: 'Use the sandbox number.',
      at: '19:56',
    });

    expect(workspace.chat.at(-1)).toMatchObject({
      kind: 'user',
      text: 'Use the sandbox number.',
    });
  });

  it('lets the workspace go quiet again, so the sidebar stops shouting', () => {
    const workspace = answerAsk({ workspace: waiting(), reply: 'Skip it.', at: '19:56' });

    expect(workspace.status).toBe('idle');
  });
});
