import { AnimatePresence, motion, Reorder } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Icon, IconButton } from '@/shared/components/atoms';
import { ToTop, Tooltip } from '@/shared/components/molecules';
import { MOTION } from '@/shared/constants';
import {
  PlanCase,
  PlanChanges,
  PlanDoubts,
  PlanStrategy,
  PublishModal,
  UndoToast,
} from './components';
import { usePlanViewModel } from './hooks';
import './styles.css';

export const Plan: React.FC = () => {
  const {
    topRef,
    isToTopShown,
    onToTop,
    secretNotice,
    manualNotice,
    onWalkWaiting,
    onKeepSecret,
    onPlainSecret,
    unread,
    onShowUnread,
    onReadUnread,
    onDismissUnread,
    plan,
    lastRuns,
    liveStatuses,
    developedIds,
    filesNotice,
    design,
    openCaseId,
    freshCaseId,
    isLocked,
    lockedLabel,
    isEmpty,
    workspaceId,
    strategy,
    doubts,
    changed,
    review,
    canCheck,
    issue,
    sources,
    onToggleCase,
    onReorder,
    onRunCase,
    orgNotice,
    orgUpdateLabel,
    onOrgUpdate,
    missingNotice,
    addMissingLabel,
    onAddMissing,
    canPublish,
    isPublishing,
    publishLabel,
    publishTip,
    publishNotice,
    isPublishOpen,
    publishTitle,
    onPublish,
    onConfirmPublish,
    onCancelPublish,
    onDismissPublish,
    exportLabel,
    canExport,
    exportNotice,
    dismissExportLabel,
    onExport,
    onDismissExport,
    onDraftInChat,
    onAddCase,
    onRemoveCase,
    onOpenBug,
    onMoveCase,
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
      <AnimatePresence initial={false}>
        {unread !== null && (
          <motion.div
            key="unread"
            className="plan__unread"
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <div className="plan__export-body plan__export-body--failed">
              <span className="plan__export-text">
                {unread.text}
                {unread.again !== null && (
                  <strong className="plan__unread-again">{unread.again}</strong>
                )}
              </span>
              <Button size="sm" onClick={onShowUnread}>
                {unread.showLabel}
              </Button>
              {unread.canRead && (
                <Button size="sm" onClick={onReadUnread}>
                  {unread.readLabel}
                </Button>
              )}
              <Tooltip content={unread.dismissLabel}>
                <IconButton
                  icon="close"
                  label={unread.dismissLabel}
                  size="sm"
                  onClick={onDismissUnread}
                />
              </Tooltip>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isEmpty ? (
        <EmptyState
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
          {filesNotice !== null && (
            <Tooltip content={filesNotice.tip}>
              <p className="plan__files">
                <Icon name="attach" />
                {filesNotice.text}
              </p>
            </Tooltip>
          )}

          <div ref={topRef} className="plan__head">
            {sources.length > 0 && (
              <div className="plan__sources">
                {sources.map((one) =>
                  one.url === null ? (
                    <div key={one.key} className="plan__source" title={one.title}>
                      <span className="plan__source-label">{one.label}</span>
                      {one.tag !== null && (
                        <span className="plan__source-tag">{one.tag}</span>
                      )}
                      <span className="plan__source-title">{one.title}</span>
                    </div>
                  ) : (
                    <a
                      key={one.key}
                      className="plan__source plan__source--link"
                      href={one.url}
                      target="_blank"
                      rel="noreferrer"
                      title={one.title}
                    >
                      <span className="plan__source-label">{one.label}</span>
                      <span className="plan__source-title">{one.title}</span>
                      <Icon name="external" />
                    </a>
                  ),
                )}
              </div>
            )}
            {strategy !== null && <PlanStrategy strategy={strategy} />}
          </div>

          <AnimatePresence initial={false}>
            {manualNotice !== null && (
              <motion.div
                key="manual"
                className="plan__export"
                role="status"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              >
                <div className="plan__export-body">
                  <span className="plan__export-text">{manualNotice.text}</span>
                  <Button size="sm" onClick={onWalkWaiting}>
                    <Icon name="manual" />
                    {manualNotice.actionLabel}
                  </Button>
                </div>
              </motion.div>
            )}
            {secretNotice !== null && (
              <motion.div
                key="secret"
                className="plan__export"
                role="status"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              >
                <div className="plan__export-body plan__export-body--missing">
                  <span className="plan__export-text">
                    {secretNotice.text}
                    {secretNotice.failure !== null && (
                      <strong className="plan__unread-again">
                        {secretNotice.failure}
                      </strong>
                    )}
                  </span>
                  <Button size="sm" variant="ghost" onClick={onPlainSecret}>
                    {secretNotice.plainLabel}
                  </Button>
                  <Button size="sm" onClick={onKeepSecret}>
                    {secretNotice.keepLabel}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {orgNotice !== null && (
              <motion.div
                key="org"
                className="plan__export"
                role="status"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              >
                <div className="plan__export-body plan__export-body--org">
                  <span className="plan__export-text">{orgNotice}</span>
                  <Button size="sm" onClick={onOrgUpdate}>
                    {orgUpdateLabel}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {missingNotice !== null && (
              <motion.div
                key="missing"
                className="plan__export"
                role="status"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              >
                <div className="plan__export-body plan__export-body--missing">
                  <span className="plan__export-text">{missingNotice}</span>
                  <Button size="sm" onClick={onAddMissing}>
                    {addMissingLabel}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <PlanChanges
            workspaceId={workspaceId}
            plan={plan}
            doubts={doubts}
            issue={issue}
            changed={changed}
            review={review}
            canCheck={canCheck}
            isLocked={isLocked}
          />

          <PlanDoubts
            workspaceId={workspaceId}
            doubts={doubts}
            issue={issue}
            plan={plan}
            isLocked={isLocked}
          />

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
            <AnimatePresence initial={false}>
              {plan.map((testCase) => (
                <PlanCase
                  key={testCase.id}
                  testCase={testCase}
                  lastRun={lastRuns[testCase.id]}
                  liveStatus={liveStatuses[testCase.id]}
                  isDeveloped={developedIds.includes(testCase.id)}
                  design={design}
                  isOpen={openCaseId === testCase.id}
                  isFresh={freshCaseId === testCase.id}
                  isLocked={isLocked}
                  onToggle={onToggleCase}
                  onRunCase={onRunCase}
                  onEditCase={onEditCase}
                  onRemoveCase={onRemoveCase}
                  onOpenBug={onOpenBug}
                  onMoveCase={onMoveCase}
                  onAddStep={onAddStep}
                  onRemoveStep={onRemoveStep}
                  onEditStep={onEditStep}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>

          {!isLocked && (
            <div className="plan__foot">
              <button type="button" className="plan__add" onClick={onAddCase}>
                <Icon name="plus" />
                {t('PLAN.ADD_CASE')}
              </button>
              <div className="plan__actions">
                {canPublish && (
                  <Tooltip content={publishTip}>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPublishing}
                      onClick={onPublish}
                    >
                      {publishLabel}
                    </Button>
                  </Tooltip>
                )}
                {canExport && (
                  <Tooltip content={t('PLAN.EXPORT_TIP')}>
                    <Button variant="ghost" size="sm" onClick={onExport}>
                      {exportLabel}
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>
          )}

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

          <AnimatePresence initial={false}>
            {publishNotice !== null && (
              <motion.div
                key="publish"
                className="plan__export"
                role="status"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              >
                <div
                  className={
                    publishNotice.isFailed
                      ? 'plan__export-body plan__export-body--failed'
                      : 'plan__export-body'
                  }
                >
                  <span className="plan__export-text">{publishNotice.text}</span>
                  <Tooltip content={dismissExportLabel}>
                    <IconButton
                      icon="close"
                      label={dismissExportLabel}
                      size="sm"
                      onClick={onDismissPublish}
                    />
                  </Tooltip>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ToTop isShown={isToTopShown} onClick={onToTop} />
        </div>
      )}

      <AnimatePresence>
        {isPublishOpen && (
          <PublishModal
            key="publish"
            title={publishTitle}
            onCancel={onCancelPublish}
            onConfirm={onConfirmPublish}
          />
        )}
      </AnimatePresence>

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
