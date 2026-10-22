import type { IBug, IFilingPlan } from '@/modules/Bug/types';
import type { IssueTarget } from '@/shared/types';

export interface IBugSendModalProps {
  workspaceId: string;
  bug: IBug;
  onCancel: () => void;
  onSend: (props: { target: IssueTarget; title: string; plan: IFilingPlan }) => void;
}
