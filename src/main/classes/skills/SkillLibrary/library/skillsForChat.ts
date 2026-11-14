import type { ISkill, ITeamSkill, SkillUse } from '@/shared/types';

/**
 * As skills que valem num chat ou numa exploração de um projeto: as ligadas para aquele
 * momento, e a que o QA chamou, cada uma com a pasta dela.
 */
export function skillsForChat(props: {
  skills: ISkill[];
  projectId: string;
  uses: SkillUse[];
  calledId: string | null;
  dirOf: (id: string) => string;
}): ITeamSkill[] {
  return props.skills
    .filter(
      (skill) =>
        skill.isOn &&
        (skill.projectIds === null || skill.projectIds.includes(props.projectId)) &&
        (skill.id === props.calledId || props.uses.includes(skill.use)),
    )
    .map((skill) => ({
      name: skill.name,
      description: skill.description,
      body: skill.body,
      dir: props.dirOf(skill.id),
      isCalled: skill.id === props.calledId,
    }));
}
