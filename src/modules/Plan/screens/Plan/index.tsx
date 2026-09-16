import { Reorder } from 'motion/react';
import { Button, EmptyState } from '@/components/atoms';
import { PlanCase } from './components';
import { usePlanViewModel } from './hooks';
import './styles.css';

export const Plan: React.FC = () => {
  const {
    plan,
    openCaseId,
    isLocked,
    isEmpty,
    summary,
    onToggleCase,
    onReorder,
    onRunAll,
    onStop,
    onDraftInChat,
  } = usePlanViewModel();

  if (isEmpty) {
    return (
      <EmptyState
        title="No plan yet."
        body="Write the cases yourself, or say what this workspace covers and let the agent draft them."
        action={
          <Button variant="primary" onClick={onDraftInChat}>
            Draft it in chat
          </Button>
        }
      />
    );
  }

  return (
    <div className="plan">
      <div className="plan__head">
        <span className="plan__summary">{summary}</span>
        <span className="plan__note">
          Drafted by Claude Code. Click a case to open it, drag it to move it.
        </span>
        <div className="plan__actions">
          {isLocked ? (
            <Button variant="danger" onClick={onStop}>
              Stop the run
            </Button>
          ) : (
            <Button variant="primary" onClick={onRunAll}>
              Run all
            </Button>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="plan__locked">
          <span aria-hidden="true">🔒</span>
          Claude is running this plan. Stop the run if you want to change it.
        </div>
      )}

      <Reorder.Group axis="y" values={plan} onReorder={onReorder} className="plan__cases">
        {plan.map((testCase) => (
          <PlanCase
            key={testCase.id}
            testCase={testCase}
            isOpen={openCaseId === testCase.id}
            isLocked={isLocked}
            onToggle={onToggleCase}
          />
        ))}
      </Reorder.Group>
    </div>
  );
};
