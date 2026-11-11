import { useTranslation } from 'react-i18next';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useAppStore } from '@/store';

export const useWorkspaceMeta = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    projectId: opened.projectId,
    targetId: opened.targetId,
    caseCount: opened.plan.length,
  }));
  const hasTarget = useAppStore((state) =>
    state.projects.some(
      (project) =>
        project.id === workspace?.projectId &&
        project.targets.some(({ id }) => id === workspace.targetId),
    ),
  );
  const caseCount = workspace?.caseCount ?? 0;

  return {
    metaKey: hasTarget
      ? ('WORKSPACE.META_ON' as const)
      : ('WORKSPACE.META_NO_APP' as const),
    metaCases:
      caseCount === 0
        ? t('WORKSPACE.META_CASES_NONE')
        : caseCount === 1
          ? t('WORKSPACE.META_CASES_ONE')
          : t('WORKSPACE.META_CASES_OTHER', { count: caseCount }),
  };
};
