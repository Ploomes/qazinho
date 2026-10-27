import { ModalFrame } from '@/shared/components/templates';
import { useProLinkModalViewModel } from './hooks';
import './styles.css';

/**
 * Opens a plan a link from the web named that this computer does not hold: downloads its
 * project from the org, or says why it cannot.
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
