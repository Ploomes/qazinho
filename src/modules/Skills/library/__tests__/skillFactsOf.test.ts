// @vitest-environment jsdom
import type { IProject } from '@/modules/Project/types';
import type { ISkill } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { skillFactsOf } from '@/modules/Skills/library';

const SKILL: ISkill = {
  id: 's1',
  name: 'cases-gherkin',
  description: 'When writing cases',
  body: 'Gherkin.',
  files: [],
  use: 'cases',
  projectIds: null,
  isOn: true,
  source: { kind: 'created' },
  updatedAt: '',
};

const PROJECTS = [{ id: 'p1', name: 'Shop' }] as IProject[];

const facts = (skill: Partial<ISkill>) =>
  skillFactsOf({ skill: { ...SKILL, ...skill }, projects: PROJECTS, t: i18n.t });

describe('skillFactsOf', () => {
  it('says where a skill applies, for which projects, and where it came from', async () => {
    await i18n.changeLanguage('en');

    expect(facts({})).toEqual({
      facts: 'When writing cases, All projects',
      source: 'Made here',
    });
    expect(
      facts({
        use: 'called',
        projectIds: ['p1'],
        source: {
          kind: 'repo',
          repository: 'shop/qa',
          branch: 'main',
          folder: 'x',
          commit: 'c',
        },
      }),
    ).toEqual({ facts: 'When I call it, Shop', source: 'From shop/qa' });
  });

  it('says when no project is picked, rather than nothing', async () => {
    await i18n.changeLanguage('en');

    expect(facts({ projectIds: [] }).facts).toBe('When writing cases, No project picked');
  });
});
