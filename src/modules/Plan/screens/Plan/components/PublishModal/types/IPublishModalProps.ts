/**
 * Where a plan is published the first time: the title it starts with, and what the QA
 * picked once they confirm.
 */
export interface IPublishModalProps {
  title: string;
  onCancel: () => void;
  onConfirm: (props: { spaceId: string; parentId: string | null; title: string }) => void;
}
