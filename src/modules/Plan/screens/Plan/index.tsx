import { AnimatePresence, motion, Reorder } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Icon, IconButton } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { MOTION } from '@/shared/constants';
import { PlanCase, UndoToast } from './components';
import { usePlanViewModel } from './hooks';
import './styles.css';

export const Plan: React.FC = () => {
  const {
    plan,
    lastRuns,
    design,
    openCaseId,
    isLocked,
    lockedLabel,
    isEmpty,
    summary,
    source,
    story,
    page,
    onToggleCase,
    onReorder,
    onRunAll,
    onStop,
    exportLabel,
    canExport,
    exportNotice,
    dismissExportLabel,
    onExport,
    onDismissExport,
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
                <Tooltip content={t('PLAN.STOP_TIP')}>
                  <Button variant="danger" onClick={onStop}>
                    {t('PLAN.STOP_RUN')}
                  </Button>
                </Tooltip>
              ) : (
                <>
                  {canExport && (
                    <Tooltip content={t('PLAN.EXPORT_TIP')}>
                      <Button onClick={onExport}>{exportLabel}</Button>
                    </Tooltip>
                  )}
                  <Tooltip content={t('PLAN.RUN_ALL_TIP')}>
                    <Button variant="primary" onClick={onRunAll}>
                      {t('PLAN.RUN_ALL')}
                    </Button>
                  </Tooltip>
                </>
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {exportNotice !== null && (
              <motion.div
                key="export"
                className="plan__export"
                role="status"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              >
                <div className="plan__export-body">
                  <span className="plan__export-text">{exportNotice}</span>
                  <Tooltip content={dismissExportLabel}>
                    <IconButton
                      icon="close"
                      label={dismissExportLabel}
                      size="sm"
                      onClick={onDismissExport}
                    />
                  </Tooltip>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {story !== null && (
            <a
              className="plan__source plan__source--link"
              href={story.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="plan__source-mark" aria-hidden="true" />
              {story.text}
              <Icon name="external" />
            </a>
          )}

          {page !== null && (
            <a
              className="plan__source plan__source--link"
              href={page.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="plan__source-mark" aria-hidden="true" />
              {page.text}
              <Icon name="external" />
            </a>
          )}

          {source !== null && (
            <div className="plan__source">
              <span className="plan__source-mark" aria-hidden="true" />
              {source}
            </div>
          )}

          {isLocked && (
            <div className="plan__locked">
              <Icon name="lock" />
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
                  design={design}
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
              <Icon name="plus" />
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
