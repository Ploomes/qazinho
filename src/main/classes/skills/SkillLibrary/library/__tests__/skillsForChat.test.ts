import type { ISkill } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { skillsForChat } from '@/main/classes/skills/SkillLibrary/library';

const skill = (props: Partial<ISkill>): ISkill => ({
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
  ...props,
});

const pick = (skills: ISkill[], calledId: string | null = null) =>
  skillsForChat({
    skills,
    projectId: 'p1',
    uses: ['cases'],
    calledId,
    dirOf: (id) => `/skills/${id}`,
  });

describe('skillsForChat', () => {
  it('hands the skills turned on for writing cases in this project, with their folders', () => {
    expect(pick([skill({}), skill({ id: 's2', projectIds: ['p1'] })])).toEqual([
      {
        name: 'cases-gherkin',
        description: 'When writing cases',
        body: 'Gherkin.',
        dir: '/skills/s1',
        isCalled: false,
      },
      expect.objectContaining({ dir: '/skills/s2' }),
    ]);
  });

  it('does NOT hand one turned off, of another project, or for another moment', () => {
    expect(
      pick([
        skill({ isOn: false }),
        skill({ projectIds: ['p2'] }),
        skill({ use: 'explore' }),
        skill({ use: 'called' }),
      ]),
    ).toEqual([]);
  });

  it('hands the skill the QA called, marked as called', () => {
    expect(pick([skill({ use: 'called' })], 's1')).toEqual([
      expect.objectContaining({ isCalled: true }),
    ]);
    expect(pick([skill({ use: 'called', isOn: false })], 's1')).toEqual([]);
  });
});
