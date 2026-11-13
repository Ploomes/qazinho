import { describe, expect, it } from 'vitest';
import { sprintWorkspaceOf } from '@/modules/Home/library';

const STORY = {
  key: 'SHOP-892',
  title: 'frete grátis acima de R$ 200.',
  status: 'Pronto para dev',
  url: 'https://acme.atlassian.net/browse/SHOP-892',
};

describe('sprintWorkspaceOf', () => {
  it('names the plan by the story, keeps the story, and takes the project’s app', () => {
    const workspace = sprintWorkspaceOf({
      project: {
        id: 'p1',
        name: 'Loja',
        targets: [
          { id: 't-android', kind: 'android', label: 'Android', value: 'loja.apk' },
        ],
        repositories: [],
      },
      story: STORY,
      now: 7,
    });

    expect(workspace).toMatchObject({
      id: 'w-7',
      projectId: 'p1',
      name: 'Frete grátis acima de R$ 200',
      targetId: 't-android',
      planKind: 'mobile',
      issue: { key: 'SHOP-892', title: STORY.title, source: 'jira', url: STORY.url },
    });
  });

  it('starts with no app in a project that has none, and names a story with no title by its key', () => {
    const workspace = sprintWorkspaceOf({
      project: { id: 'p1', name: 'Loja', targets: [], repositories: [] },
      story: { ...STORY, title: '' },
      now: 7,
    });

    expect(workspace).toMatchObject({ name: 'SHOP-892', targetId: '' });
  });
});
