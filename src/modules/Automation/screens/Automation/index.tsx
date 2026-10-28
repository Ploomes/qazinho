import { AnimatePresence, motion } from 'motion/react';
import { Button, EmptyState, Eyebrow, Icon, IconButton } from '@/shared/components/atoms';
import {
  SuiteChangeReview,
  SuiteRequestPane,
  SuiteRequests,
  SuiteTestPane,
  SuiteTree,
  SuiteWriteModal,
} from './components';
import { useAutomationViewModel } from './hooks';
import './styles.css';

/**
 * A suíte de Playwright de um projeto: os testes por pasta, como cada um foi, e uma run
 * de todos, dos que falharam, de uma pasta ou de um teste.
 */
export const Automation: React.FC = () => {
  const {
    hasProject,
    hasSuite,
    style,
    transition,
    markIconSize,
    connect,
    onConnect,
    name,
    runner,
    runnerClassName,
    branch,
    repository,
    count,
    reloadLabel,
    onReload,
    settingsLabel,
    onSettings,
    isRunning,
    stopLabel,
    onStop,
    canRun,
    canRunAll,
    runAllLabel,
    onRunAll,
    hasFailed,
    failedCount,
    runFailedLabel,
    onRunFailed,
    progress,
    searchLabel,
    query,
    onSearch,
    lastRun,
    notice,
    listView,
    isListing,
    listingText,
    failure,
    noTestsText,
    nothingFoundText,
    tree,
    pick,
    pane,
    review,
    onCloseReview,
    newTestLabel,
    canAskNewTest,
    onNewTest,
    writing,
    requests,
    requestPane,
  } = useAutomationViewModel();

  if (!hasProject) return null;

  if (!hasSuite)
    return (
      <section className="automation automation--empty">
        <EmptyState
          mood="neutral"
          title={connect.title}
          body={connect.text}
          action={
            <div className="automation__connect">
              <Button variant="primary" onClick={onConnect}>
                {connect.label}
              </Button>
              {connect.refused !== null && (
                <p className="automation__refused">{connect.refused}</p>
              )}
            </div>
          }
        />
      </section>
    );

  return (
    <section className="automation" style={style}>
      <header className="automation__header">
        <span className="automation__mark">
          <Icon name="suite" size={markIconSize} />
        </span>
        <div className="automation__heading">
          <h1 className="automation__title">{name}</h1>
          <div className="automation__facts">
            <span className={runnerClassName}>{runner}</span>
            {branch !== null && (
              <span className="automation__fact">
                <Icon name="branch" /> {branch}
              </span>
            )}
            {repository !== null && (
              <span className="automation__fact">{repository}</span>
            )}
            {count !== '' && <span className="automation__fact">{count}</span>}
          </div>
        </div>

        <div className="automation__actions">
          <IconButton icon="reload" label={reloadLabel} onClick={onReload} />
          <IconButton icon="settings" label={settingsLabel} onClick={onSettings} />
          {isRunning ? (
            <Button variant="danger" onClick={onStop}>
              {stopLabel}
            </Button>
          ) : (
            <>
              {canAskNewTest && (
                <Button variant="ghost" onClick={onNewTest}>
                  <span className="automation__new-test">
                    <Icon name="sparkle" />
                  </span>
                  {newTestLabel}
                </Button>
              )}
              {hasFailed && (
                <Button disabled={!canRun} onClick={onRunFailed}>
                  {runFailedLabel}
                  <span className="automation__badge">{failedCount}</span>
                </Button>
              )}
              <Button variant="primary" disabled={!canRunAll} onClick={onRunAll}>
                <Icon name="play" /> {runAllLabel}
              </Button>
            </>
          )}
        </div>
      </header>

      <AnimatePresence initial={false}>
        {progress !== null && (
          <motion.div
            key="progress"
            className="automation__fold"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
          >
            <div className="automation__progress">
              <span className="automation__bar" style={progress.style}>
                <span className="automation__bar-fill" />
              </span>
              <span className="automation__progress-text">{progress.label}</span>
              {progress.failed !== '' && (
                <span className="automation__progress-failed">
                  <Icon name="failed" /> {progress.failed}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="automation__toolbar">
        <label className="automation__search">
          <span className="automation__search-icon">
            <Icon name="search" />
          </span>
          <input
            className="automation__search-input"
            value={query}
            placeholder={searchLabel}
            aria-label={searchLabel}
            spellCheck={false}
            onChange={onSearch}
          />
        </label>
        {lastRun !== null && (
          <div className="automation__last">
            <Eyebrow>{lastRun.label}</Eyebrow>
            <span className="automation__last-facts">{lastRun.facts}</span>
            {lastRun.tallies.map((tally) => (
              <span key={tally.key} className={tally.className} title={tally.label}>
                <Icon name={tally.icon} label={tally.label} />
                {tally.count}
              </span>
            ))}
          </div>
        )}
      </div>

      {notice !== null && (
        <div className="automation__notice">
          <span className="automation__notice-text">
            <span className="automation__warn">
              <Icon name="attention" />
            </span>
            {notice.text}
          </span>
          {notice.said !== '' && <pre className="automation__said">{notice.said}</pre>}
        </div>
      )}

      <div className="automation__body">
        <div className="automation__tree">
          <SuiteRequests
            requests={requests.requests}
            pickedId={requests.pickedId}
            onPick={requests.onPick}
          />

          <AnimatePresence initial={false}>
            {isListing && (
              <motion.p
                key="listing"
                className="automation__listing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition}
              >
                <span className="automation__spin">
                  <Icon name="reload" />
                </span>
                {listingText}
              </motion.p>
            )}
          </AnimatePresence>

          {failure !== null && (
            <div className="automation__failure">
              <span className="automation__failure-text">
                <span className="automation__warn">
                  <Icon name="attention" />
                </span>
                {failure.text}
              </span>
              {failure.said !== '' && (
                <pre className="automation__said">{failure.said}</pre>
              )}
              <Button size="sm" onClick={onReload}>
                <Icon name="reload" /> {reloadLabel}
              </Button>
            </div>
          )}

          {listView === 'empty' && <p className="automation__quiet">{noTestsText}</p>}
          {listView === 'nothing' && (
            <p className="automation__quiet">{nothingFoundText}</p>
          )}
          {listView === 'tree' && (
            <SuiteTree
              folders={tree.folders}
              last={tree.last}
              going={tree.going}
              pickedId={tree.pickedId}
              shut={tree.shut}
              isQuerying={tree.isQuerying}
              canRun={tree.canRun}
              onToggle={tree.onToggle}
              onPick={tree.onPick}
              onRunPath={tree.onRunPath}
              onRunTest={tree.onRunTest}
            />
          )}
        </div>

        <div className="automation__pane">
          {requestPane !== null ? (
            <SuiteRequestPane
              change={requestPane.change}
              notes={requestPane.notes}
              agent={requestPane.agent}
              onStop={requestPane.onStop}
              onReview={requestPane.onReview}
              onDiscard={requestPane.onDiscard}
              onRetry={requestPane.onRetry}
            />
          ) : pane === null ? (
            <EmptyState mood="thinking" title={pick.title} body={pick.text} />
          ) : (
            <SuiteTestPane
              key={pane.key}
              projectId={pane.projectId}
              test={pane.test}
              runs={pane.runs}
              step={pane.step}
              isRunning={pane.isRunning}
              canRun={pane.canRun}
              hasProjects={pane.hasProjects}
              fix={pane.fix}
              change={pane.change}
              notes={pane.notes}
              agent={pane.agent}
              onRun={pane.onRun}
              onFix={pane.onFix}
              onStopFix={pane.onStopFix}
              onReview={pane.onReview}
              onDiscard={pane.onDiscard}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {review !== null && (
          <SuiteChangeReview
            key={review.change.id}
            change={review.change}
            canOpenPullRequest={review.canOpenPullRequest}
            onClose={onCloseReview}
          />
        )}
        {writing !== null && (
          <SuiteWriteModal
            key="write"
            folders={writing.folders}
            cases={writing.cases}
            canWrite={writing.canWrite}
            note={writing.note}
            onWrite={writing.onWrite}
            onClose={writing.onClose}
          />
        )}
      </AnimatePresence>
    </section>
  );
};
