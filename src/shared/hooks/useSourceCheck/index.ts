import type { ISourcesChecked } from '@/shared/types';
import { Sources } from '@/services';
import { useWorkspaceStore } from '@/store';

export const useSourceCheck = () => {
  const check = async (workspaceId: string): Promise<ISourcesChecked | null> => {
    const workspace = useWorkspaceStore
      .getState()
      .workspaces.find(({ id }) => id === workspaceId);
    const snapshots = workspace?.snapshots ?? [];
    const code = workspace?.planSource ?? null;

    if (workspace === undefined || (snapshots.length === 0 && code === null)) return null;

    const checked = await Sources.check({ snapshots, code });
    const { setChanged } = useWorkspaceStore.getState();

    if (checked.changes.length > 0)
      setChanged({
        workspaceId,
        changed: {
          found: checked.changes,
          snapshots: checked.snapshots,
          code: checked.code,
          at: new Date().toISOString(),
        },
      });
    else if (workspace.review === undefined) setChanged({ workspaceId, changed: null });

    return checked;
  };

  return { check };
};
