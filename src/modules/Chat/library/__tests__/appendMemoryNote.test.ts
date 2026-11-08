import type { IWorkspace } from '@/modules/Workspace';
import { describe, expect, it } from 'vitest';
import { appendMemoryNote } from '@/modules/Chat/library/appendMemoryNote';

describe('appendMemoryNote', () => {
  it('puts what changed at the end of the chat, and touches nothing else', () => {
    const workspace = { id: 'w-1', name: 'Cupons', chat: [] } as unknown as IWorkspace;
    const changes = [{ kind: 'added' as const, text: 'O SSO não funciona.' }];
    const after = appendMemoryNote({ workspace, changes, at: '10:30' });

    expect(after.chat).toEqual([{ id: 'm-1', kind: 'memory', at: '10:30', changes }]);
    expect(after.name).toBe('Cupons');
  });
});
