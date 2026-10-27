import { Button } from '@/shared/components/atoms';
import { ModalFrame } from '@/shared/components/templates';
import { PRO_RUN_WARNING } from './constants';
import { useProRunWarningViewModel } from './hooks';
import './styles.css';

/**
 * Holds a run of a plan the org moved since: update it first, or run it as it stands
 * here.
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
      onCancel={view.onCancel}
      onConfirm={view.onConfirm}
    >
      <div className="pro-run-warning">
        <Button variant="secondary" onClick={view.onRunAnyway}>
          {view.runLabel}
        </Button>
      </div>
    </ModalFrame>
  );
};
