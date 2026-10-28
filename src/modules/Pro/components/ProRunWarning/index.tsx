import { Button } from '@/shared/components/atoms';
import { ModalFrame } from '@/shared/components/templates';
import { PRO_RUN_WARNING } from './constants';
import { useProRunWarningViewModel } from './hooks';

/**
 * Segura uma run de um plano que a org mexeu desde então: atualize-o primeiro, ou rode-o
 * como está aqui.
 */
export const ProRunWarning: React.FC = () => {
  const view = useProRunWarningViewModel();

  return (
    <ModalFrame
      title={view.title}
      subtitle={view.text}
      width={PRO_RUN_WARNING.width}
      confirmLabel={view.confirmLabel}
      canConfirm={view.canConfirm}
      aside={
        <Button variant="ghost" disabled={!view.canRunAnyway} onClick={view.onRunAnyway}>
          {view.runLabel}
        </Button>
      }
      onCancel={view.onCancel}
      onConfirm={view.onConfirm}
    />
  );
};
