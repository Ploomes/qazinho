import { describe, expect, it } from 'vitest';
import { bugTypeOf } from '@/main/classes/integrations/JiraApi/library';

describe('bugTypeOf', () => {
  it('files as the project’s Bug, in any language Jira names it', () => {
    expect(
      bugTypeOf({
        issueTypes: [
          { id: '1', name: 'Story', subtask: false },
          { id: '2', name: 'Bug', subtask: false },
        ],
      }),
    ).toBe('2');
    expect(
      bugTypeOf({ values: [{ id: '7', name: 'Defeito', untranslatedName: 'Bug' }] }),
    ).toBe('7');
  });

  it('falls back to the Task, then to the first type that is not a subtask', () => {
    expect(
      bugTypeOf({
        issueTypes: [
          { id: '1', name: 'Epic' },
          { id: '3', name: 'Tarefa' },
        ],
      }),
    ).toBe('3');
    expect(
      bugTypeOf({
        issueTypes: [
          { id: '5', name: 'Bug', subtask: true },
          { id: '6', name: 'Request' },
        ],
      }),
    ).toBe('6');
  });

  it('finds none in an answer that lists no type', () => {
    expect(bugTypeOf({ issueTypes: [] })).toBeNull();
    expect(bugTypeOf(null)).toBeNull();
  });
});
