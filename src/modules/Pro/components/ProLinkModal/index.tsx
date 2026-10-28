import { ModalFrame } from '@/shared/components/templates';
import { useProLinkModalViewModel } from './hooks';
import './styles.css';

/**
 * Abre um plano que um link da web nomeou e que este computador não tem: baixa o projeto
 * dele da org, ou diz por que não pode.
 */
export const ProLinkModal: React.FC = () => {
  const view = useProLinkModalViewModel();

  return (
    <ModalFrame
      title={view.title}
      subtitle={view.subtitle}
      width={480}
      confirmLabel={view.confirmLabel}
      canConfirm={view.canConfirm}
      onCancel={view.onCancel}
      onConfirm={view.onConfirm}
    >
      {view.hasNames && <p className="pro-link__names">{view.names}</p>}
      {view.hasFailure && (
        <p className="pro-link__failure" role="alert">
          {view.failure}
        </p>
      )}
    </ModalFrame>
  );
};
