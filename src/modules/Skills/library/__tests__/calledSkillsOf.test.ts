import type { ISkill } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { calledSkillsOf } from '@/modules/Skills/library/calledSkillsOf';

const skill = (props: Partial<ISkill>): ISkill => ({
  id: 's1',
  name: 'edges',
  description: 'Limits, empty fields and permissions',
  body: 'Every field gets a limit case.',
  files: [],
  use: 'called',
  projectIds: null,
  isOn: true,
  source: { kind: 'created' },
  updatedAt: '',
  ...props,
});

const namesOf = (skills: ISkill[], projectId: string | null) =>
  calledSkillsOf({ skills, projectId }).map(({ name }) => name);

describe('calledSkillsOf', () => {
  it('offers the skills that are on and called, by name', () => {
    expect(
      namesOf(
        [
          skill({ id: 's2', name: 'priority' }),
          skill({}),
          skill({ id: 's3', name: 'off', isOn: false }),
          skill({ id: 's4', name: 'cases', use: 'cases' }),
          skill({ id: 's5', name: 'explore', use: 'explore' }),
        ],
        'p1',
      ),
    ).toEqual(['edges', 'priority']);
  });

  it('keeps a skill of other projects out', () => {
    const skills = [skill({ projectIds: ['p1'] }), skill({ id: 's2', name: 'all' })];

    expect(namesOf(skills, 'p1')).toEqual(['all', 'edges']);
    expect(namesOf(skills, 'p2')).toEqual(['all']);
    expect(namesOf(skills, null)).toEqual(['all']);
  });
});
