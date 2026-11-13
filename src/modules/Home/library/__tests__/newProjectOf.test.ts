import { describe, expect, it } from 'vitest';
import { newProjectOf } from '@/modules/Home/library';
import { DESIGN, EMPTY_VALUES, LABELS, STORY, TESTS } from './fixtures';

const NOW = 1_700_000_000_000;

describe('newProjectOf', () => {
  it('makes the project of an address and a story, with the story plan opened', () => {
    const made = newProjectOf({
      picks: ['web', 'story'],
      values: { ...EMPTY_VALUES, web: 'staging.loja.dev', story: STORY },
      unnamed: 'Novo projeto',
      now: NOW,
      labels: LABELS,
    });

    expect(made.project).toMatchObject({
      name: 'Novo projeto',
      isNamePending: true,
      targets: [
        { id: 't-web', kind: 'web', label: 'Web', value: 'https://staging.loja.dev' },
      ],
      repositories: [],
    });
    expect(made.workspaces).toEqual([
      expect.objectContaining({
        name: 'Frete grátis acima de R$ 200',
        targetId: 't-web',
        planKind: 'web',
        issue: {
          key: 'SHOP-892',
          title: STORY.issue.summary,
          source: 'jira',
          url: STORY.issue.url,
        },
      }),
    ]);
    expect(made.starts).toEqual([
      { kind: 'story', workspaceId: made.openId, story: STORY, design: null },
    ]);
  });

  it('puts the design on the story plan, and gives the tests a plan of their own', () => {
    const made = newProjectOf({
      picks: ['story', 'tests', 'design'],
      values: { ...EMPTY_VALUES, story: STORY, design: DESIGN, tests: TESTS },
      unnamed: 'Novo projeto',
      now: NOW,
      labels: LABELS,
    });

    expect(
      made.workspaces.map(({ name, design }) => [name, design?.name ?? null]),
    ).toEqual([
      ['Frete grátis acima de R$ 200', 'Checkout'],
      ['loja-web', null],
    ]);
    expect(new Set(made.workspaces.map(({ id }) => id)).size).toBe(2);
    expect(made.starts.map(({ kind }) => kind)).toEqual(['story', 'import']);
    expect(made.openId).toBe(made.workspaces[0]?.id);
  });

  it('starts from the design alone when there is no story', () => {
    const made = newProjectOf({
      picks: ['design'],
      values: { ...EMPTY_VALUES, design: DESIGN },
      unnamed: 'Novo projeto',
      now: NOW,
      labels: LABELS,
    });

    expect(made.starts).toEqual([
      { kind: 'design', workspaceId: made.openId, design: DESIGN },
    ]);
    expect(made.workspaces[0]).toMatchObject({
      name: 'Checkout',
      design: DESIGN,
      targetId: '',
    });
  });

  it('opens one empty plan, named by the first message, when nothing starts one', () => {
    const made = newProjectOf({
      picks: ['build', 'code'],
      values: {
        ...EMPTY_VALUES,
        builds: [{ kind: 'android', path: '/b/loja.apk' }],
        repositories: [{ id: '1', owner: 'acme', name: 'loja-app', baseBranch: 'main' }],
      },
      unnamed: 'Novo projeto',
      now: NOW,
      labels: LABELS,
    });

    expect(made.project.targets).toEqual([
      { id: 't-android', kind: 'android', label: 'Android', value: '/b/loja.apk' },
    ]);
    expect(made.project.repositories).toHaveLength(1);
    expect(made.workspaces).toEqual([
      expect.objectContaining({ name: '', targetId: 't-android', planKind: 'mobile' }),
    ]);
    expect(made.starts).toEqual([]);
  });

  it('leaves out what a card no longer picked holds', () => {
    const made = newProjectOf({
      picks: ['story'],
      values: { ...EMPTY_VALUES, web: 'https://loja.dev', story: STORY, tests: TESTS },
      unnamed: 'Novo projeto',
      now: NOW,
      labels: LABELS,
    });

    expect(made.project.targets).toEqual([]);
    expect(made.starts.map(({ kind }) => kind)).toEqual(['story']);
  });
});
