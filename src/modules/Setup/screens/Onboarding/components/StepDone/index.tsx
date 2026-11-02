import { Icon } from '@/shared/components/atoms';
import { useStepDoneViewModel } from './hooks';
import './styles.css';

export const StepDone: React.FC = () => {
  const { rows } = useStepDoneViewModel();

  return (
    <div className="step-done">
      {rows.map((row) => (
        <div
          key={row.id}
          className={
            row.isReady ? 'step-done__row step-done__row--ready' : 'step-done__row'
          }
        >
          <span className="step-done__mark">
            <Icon name={row.icon} />
          </span>
          <span className="step-done__label">{row.label}</span>
          <span className="step-done__value">{row.value}</span>
        </div>
      ))}
    </div>
  );
};
