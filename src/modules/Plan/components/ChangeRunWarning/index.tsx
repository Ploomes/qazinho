import { Button } from '@/shared/components/atoms';
import { ModalFrame } from '@/shared/components/templates';
import { CHANGE_RUN_WARNING } from './constants';
import { useChangeRunWarningViewModel } from './hooks';

/**
 * Segura uma run de um plano cujas fontes mudaram sem as trocas revistas: revise antes,
 * ou rode como está.
 */
export const ChangeRunWarning: React.FC = () => {
  const view = useChangeRunWarningViewModel();

  return (
    <ModalFrame
      title={view.title}
      subtitle={view.text}
      width={CHANGE_RUN_WARNING.width}
      confirmLabel={view.confirmLabel}
      canConfirm={view.canConfirm}
      aside={
        <Button variant="ghost" onClick={view.onRunAnyway}>
          {view.runLabel}
        </Button>
      }
      onCancel={view.onCancel}
      onConfirm={view.onConfirm}
    />
  );
};
