import { describe, expect, it } from 'vitest';
import { jiraProjectsOf } from '@/main/classes/integrations/JiraApi/library';

describe('jiraProjectsOf', () => {
  it('reads a plain list of projects and a page of them alike', () => {
    expect(jiraProjectsOf([{ key: 'SHOP', name: 'Loja' }])).toEqual([
      { key: 'SHOP', name: 'Loja' },
    ]);
    expect(jiraProjectsOf({ values: [{ key: 'OPS', name: 'Operações' }] })).toEqual([
      { key: 'OPS', name: 'Operações' },
    ]);
  });

  it('names a project with no name by its key, and skips one with no key', () => {
    expect(jiraProjectsOf([{ key: 'QA' }, { name: 'Lost' }, null])).toEqual([
      { key: 'QA', name: 'QA' },
    ]);
  });

  it('reads nothing out of an answer that is not a list', () => {
    expect(jiraProjectsOf({ errorMessages: [] })).toEqual([]);
    expect(jiraProjectsOf(null)).toEqual([]);
  });
});
