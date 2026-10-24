import { useEffect, useRef } from 'react';
import { mergeCases, syncedCaseOf, testCasesOf } from '@/modules/Pro/library';
import { Pro } from '@/services';
import { useProStore, useWorkspaceStore } from '@/store';

export const useProConflicts = () => {
  const shares = useProStore((state) => state.shares);
  const landShare = useProStore((state) => state.landShare);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const setPlan = useWorkspaceStore((state) => state.setPlan);
  const handled = useRef(new Set<string>());

  useEffect(() => {
    for (const share of shares)
      for (const conflict of share.conflicts) {
        const key = `${share.projectId}/${conflict.workspaceId}/${String(conflict.version)}`;
        const workspace = workspaces.find(({ id }) => id === conflict.workspaceId);

        if (handled.current.has(key) || !workspace) continue;
        if (workspace.live !== null && !workspace.live.isDone) continue;

        const plan = testCasesOf({
          cases: mergeCases({
            base: conflict.base,
            mine: workspace.plan.map(syncedCaseOf),
            theirs: conflict.cases,
          }),
          local: workspace.plan,
        });

        handled.current.add(key);
        void Pro.resolve({
          projectId: share.projectId,
          workspaceId: workspace.id,
          version: conflict.version,
        }).then((resolved) => {
          landShare(resolved);
          setPlan({ workspaceId: workspace.id, plan });
        });
      }
  }, [shares, workspaces, landShare, setPlan]);
};
