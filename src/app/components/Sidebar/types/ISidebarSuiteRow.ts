import type { IconName } from '@/shared/components/atoms/Icon/types';

/** A project's automated suite in the sidebar: how its last run went, or how far the run going is. */
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
  hint: string | undefined;
}
