import type { ISaveSkill, ISkill } from '@/shared/types';

/** Uma skill como volta à main para guardar, com as mudanças dadas por cima. */
export function saveOfSkill(props: {
  skill: ISkill;
  change: Partial<Pick<ISaveSkill, 'isOn' | 'use' | 'projectIds'>>;
}): ISaveSkill {
  const { skill, change } = props;

  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    body: skill.body,
    use: change.use ?? skill.use,
    projectIds: change.projectIds === undefined ? skill.projectIds : change.projectIds,
    isOn: change.isOn ?? skill.isOn,
    draftId: null,
  };
}
