import type { IWorkspaceTabsProps } from '@/modules/Workspace/screens/Workspace/components/WorkspaceTabs/types';

export const useWorkspaceTabsViewModel = (props: IWorkspaceTabsProps) => {
  const { current, planCount, runCount, bugCount } = props;

  const items = [
    { id: 'chat' as const, label: 'Chat', badge: '' },
    { id: 'plan' as const, label: 'Plan', badge: String(planCount) },
    { id: 'runs' as const, label: 'Runs', badge: String(runCount) },
    { id: 'bugs' as const, label: 'Bugs', badge: String(bugCount) },
  ].map((item) => ({ ...item, isActive: item.id === current }));

  return { items, onTabClick: props.onSelect };
};
