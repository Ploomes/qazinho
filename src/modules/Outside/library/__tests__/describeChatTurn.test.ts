import type { IWorkspace } from '@/modules/Workspace';
import { describe, expect, it } from 'vitest';
import { describeChatTurn } from '@/modules/Outside/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

const withChat = (chat: IWorkspace['chat']): IWorkspace => ({ ...makeWorkspace(), chat });

describe('describeChatTurn', () => {
  it('tells only what came after the last message sent to the agent', () => {
    const told = describeChatTurn({
      workspace: withChat([
        { id: 'm-1', kind: 'user', at: '10:00', text: 'Hi' },
        { id: 'm-2', kind: 'agent', at: '10:00', who: 'Claude Code', text: 'Old answer' },
        { id: 'm-3', kind: 'user', at: '10:01', text: 'Plan it', from: 'agent' },
        { id: 'm-4', kind: 'plan', at: '10:02', caseCount: 3, stepCount: 9 },
      ]),
      isAnswering: false,
    });

    expect(told.text).toContain('It wrote the plan: 3 cases, 9 steps.');
    expect(told.text).not.toContain('Old answer');
  });

  it('says the agent still works while it answers', () => {
    expect(
      describeChatTurn({
        workspace: withChat([{ id: 'm-1', kind: 'user', at: '10:00', text: 'Plan it' }]),
        isAnswering: true,
      }).text,
    ).toContain('still working on it');
  });

  it('says when nobody wrote in the chat yet', () => {
    expect(
      describeChatTurn({ workspace: withChat([]), isAnswering: false }).text,
    ).toContain('Nobody wrote');
  });
});
