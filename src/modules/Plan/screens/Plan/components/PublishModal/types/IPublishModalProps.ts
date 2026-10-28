/**
 * Onde um plano é publicado pela primeira vez: o título com que começa, e o que o QA
 * escolheu quando confirma.
 */
export interface IPublishModalProps {
  title: string;
  onCancel: () => void;
  onConfirm: (props: { spaceId: string; parentId: string | null; title: string }) => void;
}
