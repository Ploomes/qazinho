import type { IPlanStagesProps } from './types';
import { Icon } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { usePlanStagesViewModel } from './hooks';
import './styles.css';

/** As três etapas de um plano, e em qual ele está: escrever, desenvolver, rodar. */
export const PlanStages: React.FC<IPlanStagesProps> = (props) => {
  const { stages } = usePlanStagesViewModel(props);

  return (
    <ol className="plan-stages">
      {stages.map((stage) => (
        <li
          key={stage.key}
          className={`plan-stages__stage plan-stages__stage--${stage.state}`}
        >
          <Tooltip content={stage.tip}>
            <span className="plan-stages__inner">
              <span className="plan-stages__mark">
                {stage.state === 'done' ? (
                  <Icon name="passed" />
                ) : stage.state === 'live' ? (
                  <Icon name="running" />
                ) : (
                  stage.number
                )}
              </span>
              <span className="plan-stages__label">{stage.label}</span>
            </span>
          </Tooltip>
        </li>
      ))}
    </ol>
  );
};
