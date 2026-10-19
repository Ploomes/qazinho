import { AnimatePresence, Reorder } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState } from '@/shared/components/atoms';
import { PlanCase } from './components';
import { usePlanViewModel } from './hooks';
import './styles.css';

export const Plan: React.FC = () => {
  const {
    plan,
    lastRuns,
    openCaseId,
    isLocked,
    lockedLabel,
    isEmpty,
    summary,
    onToggleCase,
    onReorder,
    onRunAll,
    onStop,
    onDraftInChat,
    onAddCase,
    onRemoveCase,
    onEditCase,
    onAddStep,
    onRemoveStep,
    onEditStep,
  } = usePlanViewModel();
  const { t } = useTranslation();

  if (isEmpty) {
    return (
      <EmptyState
        mood="neutral"
        title={t('PLAN.EMPTY_TITLE')}
        body={t('PLAN.EMPTY_BODY')}
        action={
          <>
            <Button variant="primary" onClick={onDraftInChat}>
              {t('PLAN.EMPTY_ACTION')}
            </Button>
            <Button onClick={onAddCase}>{t('PLAN.ADD_CASE')}</Button>
          </>
        }
      />
    );
  }

  return (
    <div className="plan">
      <div className="plan__head">
        <span className="plan__summary">{summary}</span>
        <span className="plan__note">{t('PLAN.NOTE')}</span>
        <div className="plan__actions">
          {isLocked ? (
            <Button variant="danger" onClick={onStop}>
              {t('PLAN.STOP_RUN')}
            </Button>
          ) : (
            <Button variant="primary" onClick={onRunAll}>
              {t('PLAN.RUN_ALL')}
            </Button>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="plan__locked">
          <span aria-hidden="true">🔒</span>
          {lockedLabel}
        </div>
      )}

      <Reorder.Group axis="y" values={plan} onReorder={onReorder} className="plan__cases">
        <AnimatePresence initial={false} mode="popLayout">
          {plan.map((testCase) => (
            <PlanCase
              key={testCase.id}
              testCase={testCase}
              lastRun={lastRuns[testCase.id]}
              isOpen={openCaseId === testCase.id}
              isLocked={isLocked}
              onToggle={onToggleCase}
              onEditCase={onEditCase}
              onRemoveCase={onRemoveCase}
              onAddStep={onAddStep}
              onRemoveStep={onRemoveStep}
              onEditStep={onEditStep}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {!isLocked && (
        <button type="button" className="plan__add" onClick={onAddCase}>
          <span aria-hidden="true">+</span>
          {t('PLAN.ADD_CASE')}
        </button>
      )}
    </div>
  );
};
