import type { IconName } from '@/shared/components/atoms/Icon/types';

/** A project's name over its workspaces, with where its sending to an org of QAzinho Pro stands when it is shared. */
export interface ISidebarHeaderRow {
  kind: 'header';
  id: string;
  projectId: string;
  name: string;
  sync: { icon: IconName; label: string; className: string } | null;
}
