import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { BugThumb } from '@/modules/Bug/components';
import { EmptyState } from '@/shared/components/atoms';
import { ToTop } from '@/shared/components/molecules';
import { BugFilingPopup, BugPage, BugSendModal } from './components';
import { useBugsViewModel } from './hooks';
import './styles.css';

export const Bugs: React.FC = () => {
  const {
    topRef,
    isToTopShown,
    onToTop,
    style,
    rows,
    page,
    onBack,
    workspaceId,
    tabs,
    isEmpty,
    emptyTab,
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
    <div ref={topRef} className="bugs" style={style}>
      {page === null ? (
        <>
          <div className="bugs__tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                className={tab.className}
                aria-selected={tab.isActive}
                onClick={tab.onClick}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={tab.countClassName}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className="bugs__none">{emptyTab}</p>
          ) : (
            <div className="bugs__list">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className="bugs__row"
                  onClick={row.onOpen}
                >
                  <BugThumb src={row.thumb.src} file={row.thumb.file} />
                  <span className="bugs__text">
                    <span className="bugs__title">{row.title}</span>
                    <span className="bugs__where">{row.where}</span>
                  </span>
                  <span className="bugs__seen">{row.seen}</span>
                  <span className="bugs__when">{row.when}</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <BugPage
          key={page.bug.id}
          workspaceId={workspaceId}
          bug={page.bug}
          hasRun={page.hasRun}
          hasCase={page.hasCase}
          lastRunId={page.lastRunId}
          moment={page.moment}
          onBack={onBack}
          onOpenRun={onOpenRun}
          onOpenCase={onOpenCase}
          onSend={onSend}
          onDismiss={onDismiss}
        />
      )}

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
