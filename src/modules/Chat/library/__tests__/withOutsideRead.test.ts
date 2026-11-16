import type { ChatMessage } from '@/modules/Chat/types';
import { describe, expect, it } from 'vitest';
import { withOutsideRead } from '@/modules/Chat/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

const chat: ChatMessage[] = [
  {
    id: 'm-1',
    kind: 'user',
    at: '10:00',
    text: 'Plan it',
    from: 'agent',
    caller: 'codex',
  },
  { id: 'm-2', kind: 'agent', at: '10:01', who: 'Estagiário', text: 'Done.' },
  { id: 'm-3', kind: 'user', at: '10:02', text: 'And the coupon?', from: 'agent' },
  { id: 'm-4', kind: 'agent', at: '10:03', who: 'Estagiário', text: 'It works.' },
];

describe('withOutsideRead', () => {
  it('marks when the coding agent read the answer to its last message', () => {
    const read = withOutsideRead({
      workspace: { ...makeWorkspace(), chat },
      at: '10:04',
    });

    expect(read.chat[2]).toMatchObject({ readAt: '10:04' });
    expect(read.chat[0]).not.toHaveProperty('readAt');
  });

  it('keeps the first time it was read', () => {
    const once = withOutsideRead({
      workspace: { ...makeWorkspace(), chat },
      at: '10:04',
    });
    const twice = withOutsideRead({ workspace: once, at: '10:09' });

    expect(twice.chat[2]).toMatchObject({ readAt: '10:04' });
  });

  it('changes nothing in a chat where no coding agent wrote', () => {
    const workspace = {
      ...makeWorkspace(),
      chat: [{ id: 'm-1', kind: 'user', at: '10:00', text: 'Hi' } as const],
    };

    expect(withOutsideRead({ workspace, at: '10:04' })).toBe(workspace);
  });
});
