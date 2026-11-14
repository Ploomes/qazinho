import type { IWorkspace } from '@/modules/Workspace';
import { describe, expect, it } from 'vitest';
import { appendSkillsNote } from '@/modules/Chat/library/appendSkillsNote';

const workspace = { id: 'w-1', name: 'Cupons', chat: [] } as unknown as IWorkspace;

describe('appendSkillsNote', () => {
  it('names the skills the agent got at the end of the chat, and touches nothing else', () => {
    const after = appendSkillsNote({
      workspace,
      names: ['cases-gherkin', 'edges'],
      at: '10:30',
    });

    expect(after.chat).toEqual([
      { id: 'm-1', kind: 'skills', at: '10:30', names: ['cases-gherkin', 'edges'] },
    ]);
    expect(after.name).toBe('Cupons');
  });

  it('says nothing when the turn got no skill', () => {
    expect(appendSkillsNote({ workspace, names: [], at: '10:30' })).toBe(workspace);
  });
});
