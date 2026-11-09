import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useWorkspaceStore } from '@/store';

export const useChatOnly = () => {
  const workspace = useSelectedWorkspacePart(({ id, plan, runs, live }) => ({
    id,
    isAlone: plan.length === 0 && runs.length === 0 && live === null,
  }));
  const hasBrowser = useWorkspaceStore(
    (state) => workspace !== null && state.chatDevices[workspace.id] !== undefined,
  );

  return workspace?.isAlone === true && !hasBrowser;
};
