import { AnimatePresence, Reorder } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState } from '@/shared/components/atoms';
import { PlanCase, UndoToast } from './components';
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
    source,
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
    undo,
    onUndo,
    onUndoExpire,
  } = usePlanViewModel();
  const { t } = useTranslation();

  return (
    <>
      {isEmpty ? (
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
      ) : (
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

          {source !== null && (
            <div className="plan__source">
              <span className="plan__source-mark" aria-hidden="true" />
              {source}
            </div>
          )}

          {isLocked && (
            <div className="plan__locked">
              <span aria-hidden="true">🔒</span>
              {lockedLabel}
            </div>
          )}

          <Reorder.Group
            axis="y"
            values={plan}
            onReorder={onReorder}
            className="plan__cases"
          >
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
      )}

      <div className="plan__undo">
        <AnimatePresence mode="wait">
          {undo !== null && (
            <UndoToast
              key={undo.key}
              text={undo.text}
              actionLabel={undo.actionLabel}
              onUndo={onUndo}
              onExpire={onUndoExpire}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
