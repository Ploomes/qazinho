import { describe, expect, it } from 'vitest';
import { sprintStoriesOf } from '@/main/classes/integrations/JiraApi/library';

const SITE = 'https://acme.atlassian.net';
const issueOf = (key: string, type: Record<string, unknown>) => ({
  key,
  fields: {
    summary: ` Story ${key} `,
    status: { name: 'Ready for dev' },
    issuetype: type,
  },
});

describe('sprintStoriesOf', () => {
  it('lists the stories with their status and where they open', () => {
    expect(
      sprintStoriesOf({
        body: { issues: [issueOf('SHOP-892', { name: 'Story', hierarchyLevel: 0 })] },
        site: SITE,
      }),
    ).toEqual([
      {
        key: 'SHOP-892',
        title: 'Story SHOP-892',
        status: 'Ready for dev',
        url: `${SITE}/browse/SHOP-892`,
      },
    ]);
  });

  it('leaves out subtasks and epics, by level or by the subtask flag', () => {
    const keys = sprintStoriesOf({
      body: {
        issues: [
          issueOf('SHOP-1', { name: 'Task', hierarchyLevel: 0 }),
          issueOf('SHOP-2', { name: 'Sub-task', hierarchyLevel: -1 }),
          issueOf('SHOP-3', { name: 'Epic', hierarchyLevel: 1 }),
          issueOf('SHOP-4', { name: 'Subtarefa', subtask: true }),
          issueOf('SHOP-5', { name: 'História' }),
        ],
      },
      site: SITE,
    }).map(({ key }) => key);

    expect(keys).toEqual(['SHOP-1', 'SHOP-5']);
  });

  it('skips an issue with no key, and reads an answer with no issues as none', () => {
    expect(
      sprintStoriesOf({ body: { issues: [{ fields: { summary: 'x' } }] }, site: SITE }),
    ).toEqual([]);
    expect(sprintStoriesOf({ body: {}, site: SITE })).toEqual([]);
  });
});
