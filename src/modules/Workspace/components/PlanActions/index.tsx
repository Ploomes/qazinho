import { Button } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { RunButton } from './components';
import { usePlanActionsViewModel } from './hooks';
import './styles.css';

/** As ações do plano aberto na barra de cima: explorar e rodar, ou pausar e parar. */
export const PlanActions: React.FC = () => {
  const {
    hasWorkspace,
    isLive,
    pauseLabel,
    stopLabel,
    canRun,
    canRunWithAgent,
    developedCount,
    toDevelopCount,
    toContinueCount,
    canExplore,
    exploreLabel,
    exploreTip,
    onRun,
    onRunPlan,
    onRunDeveloped,
    onRunWithAgent,
    onExplore,
    onPause,
    onStop,
  } = usePlanActionsViewModel();

  if (!hasWorkspace) return null;

  return (
    <div className="plan-actions">
      {isLive ? (
        <>
          <Button size="sm" variant="ghost" onClick={onPause}>
            {pauseLabel}
          </Button>
          <Button size="sm" variant="danger" onClick={onStop}>
            {stopLabel}
          </Button>
        </>
      ) : (
        <>
          {canExplore && (
            <Tooltip content={exploreTip}>
              <Button size="sm" variant="ghost" onClick={onExplore}>
                {exploreLabel}
              </Button>
            </Tooltip>
          )}
          <RunButton
            canRun={canRun}
            canChoose={canRunWithAgent}
            developed={developedCount}
            toDevelop={toDevelopCount}
            toContinue={toContinueCount}
            onRun={onRun}
            onRunPlan={onRunPlan}
            onRunDeveloped={onRunDeveloped}
            onRunWithAgent={onRunWithAgent}
          />
        </>
      )}
    </div>
  );
};
