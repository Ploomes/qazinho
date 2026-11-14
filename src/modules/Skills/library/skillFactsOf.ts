import type { IProject } from '@/modules/Project/types';
import type { ISkill } from '@/shared/types';
import type { TFunction } from 'i18next';
import { SKILL_USE_KEYS } from '@/modules/Skills/constants';

/**
 * Onde uma skill vale e em quais projetos, numa linha, e de onde ela veio, nas palavras
 * do QA.
 */
export function skillFactsOf(props: {
  skill: ISkill;
  projects: IProject[];
  t: TFunction;
}): { facts: string; source: string } {
  const { skill, projects, t } = props;
  const names = projects
    .filter(({ id }) => skill.projectIds?.includes(id) === true)
    .map(({ name }) => name);
  const reach =
    skill.projectIds === null
      ? t('SKILLS.ALL_PROJECTS')
      : names.length === 0
        ? t('SKILLS.NO_PROJECT')
        : names.join(', ');

  return {
    facts: `${t(SKILL_USE_KEYS[skill.use])}, ${reach}`,
    source:
      skill.source.kind === 'repo'
        ? t('SKILLS.FROM_REPO', { repository: skill.source.repository })
        : skill.source.kind === 'computer'
          ? t('SKILLS.FROM_COMPUTER')
          : t('SKILLS.FROM_CREATED'),
  };
}
