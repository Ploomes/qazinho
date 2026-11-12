import type { ISkill } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { saveOfSkill } from '@/modules/Skills/library';

const SKILL: ISkill = {
  id: 's1',
  name: 'cases-gherkin',
  description: 'When writing cases',
  body: 'Gherkin.',
  files: [],
  use: 'cases',
  projectIds: ['p1'],
  isOn: false,
  source: { kind: 'created' },
  updatedAt: '',
};

describe('saveOfSkill', () => {
  it('sends the skill back with the change on top', () => {
    expect(saveOfSkill({ skill: SKILL, change: { isOn: true } })).toEqual({
      id: 's1',
      name: 'cases-gherkin',
      description: 'When writing cases',
      body: 'Gherkin.',
      use: 'cases',
      projectIds: ['p1'],
      isOn: true,
      draftId: null,
    });
  });

  it('lets a change open a skill to every project', () => {
    expect(
      saveOfSkill({ skill: SKILL, change: { projectIds: null } }).projectIds,
    ).toBeNull();
  });
});
