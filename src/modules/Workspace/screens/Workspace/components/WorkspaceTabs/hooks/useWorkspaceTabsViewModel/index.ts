import type { IWorkspaceTabsProps } from '@/modules/Workspace/screens/Workspace/components/WorkspaceTabs/types';
import { useTranslation } from 'react-i18next';

export const useWorkspaceTabsViewModel = (props: IWorkspaceTabsProps) => {
  const { t } = useTranslation();
  const { current, planCount, runCount, bugCount } = props;

  const items = [
    { id: 'chat' as const, label: t('WORKSPACE.TAB_CHAT'), badge: '' },
    { id: 'plan' as const, label: t('WORKSPACE.TAB_PLAN'), badge: String(planCount) },
    { id: 'runs' as const, label: t('WORKSPACE.TAB_RUNS'), badge: String(runCount) },
    { id: 'bugs' as const, label: t('WORKSPACE.TAB_BUGS'), badge: String(bugCount) },
  ].map((item) => ({ ...item, isActive: item.id === current }));

  return { items, tabsLabel: t('WORKSPACE.TABS'), onTabClick: props.onSelect };
};
