import { useEffect } from 'react';
import { flattenPlanSteps } from '@/modules/Run/library';
import { Run } from '@/services';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useDevelopedWatch = () => {
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    plan: opened.plan,
    projectId: opened.projectId,
    targetId: opened.targetId,
    isLive: opened.live !== null && !opened.live.isDone,
  }));
  const targetKind = useAppStore(
    (state) =>
      state.projects
        .find(({ id }) => id === workspace?.projectId)
        ?.targets.find(({ id }) => id === workspace?.targetId)?.kind ?? null,
  );
  const setDeveloped = useWorkspaceStore((state) => state.setDevelopedCases);
  const workspaceId = workspace?.id ?? null;
  const plan = workspace?.plan ?? null;
  const isLive = workspace?.isLive === true;

  useEffect(() => {
    if (workspaceId === null || plan === null || targetKind === null || isLive) return;

    let isCurrent = true;

    void Run.developed({
      workspaceId,
      steps: flattenPlanSteps(plan),
      targetKind,
    }).then((caseIds) => {
      if (isCurrent) setDeveloped({ workspaceId, caseIds });
    });

    return () => {
      isCurrent = false;
    };
  }, [workspaceId, plan, targetKind, isLive, setDeveloped]);
};
