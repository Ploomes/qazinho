import type { ChatMessage } from '@/modules/Chat/types';
import { describe, expect, it } from 'vitest';
import { isChatAnswered } from '@/modules/Outside/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

const asked: ChatMessage = {
  id: 'm-1',
  kind: 'user',
  at: '10:00',
  text: 'Plan it',
  from: 'agent',
};
const answer: ChatMessage = {
  id: 'm-2',
  kind: 'agent',
  at: '10:01',
  who: 'Estagiário',
  text: 'Ok',
};
const workspaceWith = (chat: ChatMessage[]) => ({ ...makeWorkspace(), chat });

describe('isChatAnswered', () => {
  it('is answered once the agent of the chat said something after the coding agent', () => {
    expect(
      isChatAnswered({ workspace: workspaceWith([asked, answer]), isAnswering: false }),
    ).toBe(true);
  });

  it('is NOT answered while the agent of the chat still works, or before it said anything', () => {
    expect(
      isChatAnswered({ workspace: workspaceWith([asked, answer]), isAnswering: true }),
    ).toBe(false);
    expect(
      isChatAnswered({ workspace: workspaceWith([asked]), isAnswering: false }),
    ).toBe(false);
  });

  it('is NOT the coding agent’s answer when the QA wrote last', () => {
    const own: ChatMessage = { id: 'm-3', kind: 'user', at: '10:02', text: 'Thanks' };

    expect(
      isChatAnswered({
        workspace: workspaceWith([asked, answer, own, answer]),
        isAnswering: false,
      }),
    ).toBe(false);
  });
});
