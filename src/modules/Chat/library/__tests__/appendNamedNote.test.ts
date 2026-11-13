import type { IWorkspace } from '@/modules/Workspace';
import { describe, expect, it } from 'vitest';
import { appendNamedNote } from '@/modules/Chat/library/appendNamedNote';

const workspace = {
  id: 'w-1',
  name: 'Frete',
  chat: [{ id: 'm-1', kind: 'user', at: '10:29', text: 'oi' }],
} as unknown as IWorkspace;

describe('appendNamedNote', () => {
  it('says the name the project got and where it came from, at the end of the chat', () => {
    const after = appendNamedNote({
      workspace,
      named: { projectId: 'p-1', name: 'Loja Online', from: 'site' },
      at: '10:30',
    });

    expect(after.chat.at(-1)).toEqual({
      id: 'm-2',
      kind: 'named',
      at: '10:30',
      projectId: 'p-1',
      name: 'Loja Online',
      from: 'site',
    });
    expect(after.name).toBe('Frete');
  });
});
