import type { IPanelTabsProps } from '@/modules/Workspace/components/SidePanel/components/PanelTabs/types';
import { useTranslation } from 'react-i18next';

export const usePanelTabsViewModel = (props: IPanelTabsProps) => {
  const { t } = useTranslation();
  const { current, planCount, runCount, bugCount, isLive } = props;

  const items = [
    {
      id: 'plan' as const,
      label: t('WORKSPACE.TAB_PLAN'),
      badge: String(planCount),
      isLive: false,
    },
    { id: 'device' as const, label: t('WORKSPACE.TAB_DEVICE'), badge: '', isLive },
    {
      id: 'runs' as const,
      label: t('WORKSPACE.TAB_RUNS'),
      badge: String(runCount),
      isLive: false,
    },
    {
      id: 'bugs' as const,
      label: t('WORKSPACE.TAB_BUGS'),
      badge: String(bugCount),
      isLive: false,
    },
  ].map((item) => ({ ...item, isActive: item.id === current }));

  return { items, tabsLabel: t('WORKSPACE.TABS'), onTabClick: props.onSelect };
};
