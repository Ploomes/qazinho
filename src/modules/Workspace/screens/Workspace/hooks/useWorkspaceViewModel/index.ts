import { useTranslation } from 'react-i18next';
import { useRunControls } from '@/modules/Run/hooks';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useWorkspaceViewModel = () => {
  const { t } = useTranslation();
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const tab = useWorkspaceStore((state) => state.tab);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const { steps, live, isLive, isPaused, canRun, onRun, onPause, onStop } =
    useRunControls();

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;

  return {
    workspace,
    tab,
    name: workspace?.name ?? '',
    issueKey: workspace?.issue?.key ?? null,
    status: workspace?.status ?? 'idle',
    statusLabel: isLive
      ? t('WORKSPACE.LIVE_STEP', {
          current: live?.outcomes.length ?? 0,
          total: steps.length,
        })
      : null,
    planCount: workspace?.plan.length ?? 0,
    runCount: workspace?.runs.length ?? 0,
    bugCount: workspace?.bugs.length ?? 0,
    canRun,
    isLive,
    isPaused,
    pauseLabel: isPaused ? t('COMMON.RESUME') : t('COMMON.PAUSE'),
    onSelectTab: selectTab,
    onRun,
    onPause,
    onStop,
  };
};
