import type { ISkill } from '@/shared/types';

/** As skills que o QA chama pelo "/" num projeto: ligadas e que valem nele. */
export function calledSkillsOf(props: {
  skills: ISkill[];
  projectId: string | null;
}): ISkill[] {
  const { skills, projectId } = props;

  return skills
    .filter(
      ({ isOn, use, projectIds }) =>
        isOn &&
        use === 'called' &&
        (projectIds === null || (projectId !== null && projectIds.includes(projectId))),
    )
    .sort((one, other) => one.name.localeCompare(other.name));
}
