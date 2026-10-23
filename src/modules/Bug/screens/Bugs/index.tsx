import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/components/atoms';
import { ToTop } from '@/shared/components/molecules';
import { BugCard, BugFilingPopup, BugSendModal } from './components';
import { useBugsViewModel } from './hooks';
import './styles.css';

export const Bugs: React.FC = () => {
  const {
    topRef,
    isToTopShown,
    onToTop,
    bugs,
    workspaceId,
    openBugId,
    filters,
    isEmpty,
    summary,
    onToggleBug,
    onFilter,
    onOpenRun,
    onOpenCase,
    onDismiss,
    sending,
    onSend,
    onCancelSend,
    onSendTo,
    filing,
    onCloseFiling,
    onRetryFiling,
  } = useBugsViewModel();
  const { t } = useTranslation();

  if (isEmpty) {
    return (
      <EmptyState mood="passed" title={t('BUG.EMPTY_TITLE')} body={t('BUG.EMPTY_BODY')} />
    );
  }

  return (
    <div className="bugs">
      <div ref={topRef} className="bugs__head">
        <span className="bugs__summary">{summary}</span>
        <div className="bugs__filters">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                item.isActive ? 'bugs__filter bugs__filter--active' : 'bugs__filter'
              }
              onClick={() => {
                onFilter(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bugs__list">
        {bugs.map(({ bug, hasRun, hasCase, lastRunId, moment }) => (
          <BugCard
            key={bug.id}
            workspaceId={workspaceId}
            bug={bug}
            hasRun={hasRun}
            hasCase={hasCase}
            lastRunId={lastRunId}
            moment={moment}
            isOpen={openBugId === bug.id}
            onToggle={onToggleBug}
            onOpenRun={onOpenRun}
            onOpenCase={onOpenCase}
            onSend={onSend}
            onDismiss={onDismiss}
          />
        ))}
      </div>

      <ToTop isShown={isToTopShown} onClick={onToTop} />

      <AnimatePresence>
        {sending !== null && (
          <BugSendModal
            key="send"
            workspaceId={sending.workspaceId}
            bug={sending.bug}
            onCancel={onCancelSend}
            onSend={onSendTo}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {filing !== null && (
          <BugFilingPopup
            key={filing.filing.filingId}
            filing={filing.filing}
            bug={filing.bug}
            onClose={onCloseFiling}
            onRetry={onRetryFiling}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
