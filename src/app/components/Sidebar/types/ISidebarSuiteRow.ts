import type { IconName } from '@/shared/components/atoms/Icon/types';

/**
 * A suíte automatizada de um projeto na sidebar: como foi a última run dela, ou até onde
 * vai a run em andamento.
 */
export interface ISidebarSuiteRow {
  kind: 'suite';
  id: string;
  projectId: string;
  name: string;
  meta: string;
  icon: IconName;
  statusLabel: string;
  tone: string;
  animation: string;
  isSelected: boolean;
}
