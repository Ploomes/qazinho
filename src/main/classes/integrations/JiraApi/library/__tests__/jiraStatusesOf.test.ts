import { describe, expect, it } from 'vitest';
import { jiraStatusesOf } from '@/main/classes/integrations/JiraApi/library';

describe('jiraStatusesOf', () => {
  it('lists each status once, in the order work moves through them', () => {
    expect(
      jiraStatusesOf([
        { name: 'Done', statusCategory: { key: 'done' } },
        { name: 'Ready for QA', statusCategory: { key: 'indeterminate' } },
        { name: 'To Do', statusCategory: { key: 'new' } },
        { name: 'ready for qa', statusCategory: { key: 'indeterminate' } },
        { name: 'In QA', statusCategory: { key: 'indeterminate' } },
      ]),
    ).toEqual([
      { name: 'To Do', category: 'new' },
      { name: 'Ready for QA', category: 'indeterminate' },
      { name: 'In QA', category: 'indeterminate' },
      { name: 'Done', category: 'done' },
    ]);
  });

  it('keeps a status with a category Jira does not name, at the end', () => {
    expect(jiraStatusesOf([{ name: 'Parked' }, { name: '  ' }, null])).toEqual([
      { name: 'Parked', category: '' },
    ]);
  });

  it('reads nothing from an answer that is not a list', () => {
    expect(jiraStatusesOf({ errorMessages: ['No'] })).toEqual([]);
  });
});
