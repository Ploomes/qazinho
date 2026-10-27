import type { ISuiteTestPaneProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { SuiteChangeCard } from '@/modules/Automation/screens/Automation/components/SuiteChangeCard';
import { Button, Eyebrow, Icon } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { useSuiteTestPaneViewModel } from './hooks';
import './styles.css';

/**
 * The test the QA picked: where it is written, how it went in the run shown, with its
 * error, screens, video and trace, and the runs before.
 */
export const SuiteTestPane: React.FC<ISuiteTestPaneProps> = (props) => {
  const {
    style,
    transition,
    trail,
    title,
    where,
    project,
    tags,
    canRun,
    runLabel,
    onRun,
    isRunning,
    runningWord,
    step,
    fix,
    change,
    notes,
    agent,
    onStopFix,
    onReview,
    onDiscard,
    onRetry,
    isNeverRun,
    neverRunText,
    result,
    hasHistory,
    historyLabel,
    history,
  } = useSuiteTestPaneViewModel(props);

  return (
    <aside className="suite-test-pane" style={style}>
      <header className="suite-test-pane__head">
        <div className="suite-test-pane__heading">
          {trail !== '' && <span className="suite-test-pane__trail">{trail}</span>}
          <h2 className="suite-test-pane__title">{title}</h2>
          <div className="suite-test-pane__meta">
            <span className="suite-test-pane__where">{where}</span>
            {project !== '' && (
              <span className="suite-test-pane__project">{project}</span>
            )}
            {tags.map((tag) => (
              <span key={tag} className="suite-test-pane__tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <Button size="sm" disabled={!canRun} onClick={onRun}>
          <Icon name="play" /> {runLabel}
        </Button>
      </header>

      <AnimatePresence initial={false}>
        {isRunning && (
          <motion.div
            key="running"
            className="suite-test-pane__fold"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
          >
            <div className="suite-test-pane__running">
              <span className="suite-test-pane__state suite-test-pane__state--lime">
                <span className="suite-test-pane__pulse">
                  <Icon name="running" />
                </span>
                {runningWord}
              </span>
              {step !== null && <span className="suite-test-pane__step">{step}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {change !== null && (
        <SuiteChangeCard
          key={change.id}
          change={change}
          notes={notes}
          agent={agent}
          onStop={onStopFix}
          onReview={onReview}
          onDiscard={onDiscard}
          onRetry={onRetry}
        />
      )}

      {fix !== null && (
        <div className="suite-test-pane__fix">
          <Button disabled={!fix.canFix} onClick={fix.onFix}>
            <span className="suite-test-pane__fix-icon">
              <Icon name="sparkle" />
            </span>
            {fix.label}
          </Button>
          <span className="suite-test-pane__fix-note">{fix.note}</span>
        </div>
      )}

      {isNeverRun && <p className="suite-test-pane__never">{neverRunText}</p>}

      {result !== null && (
        <motion.section
          key={result.key}
          className="suite-test-pane__result"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
        >
          <div className="suite-test-pane__result-head">
            <span className={result.stateClassName}>
              <Icon name={result.icon} /> {result.word}
            </span>
            <span className="suite-test-pane__facts">{result.facts}</span>
            {result.trace !== null && (
              <Tooltip content={result.trace.tip}>
                <Button size="sm" variant="ghost" onClick={result.trace.onOpen}>
                  {result.trace.label} <Icon name="external" />
                </Button>
              </Tooltip>
            )}
          </div>

          {result.error !== null && (
            <div className="suite-test-pane__error">
              <Eyebrow>{result.errorLabel}</Eyebrow>
              <pre className="suite-test-pane__error-text">{result.error}</pre>
            </div>
          )}

          {result.shots.map((shot) => (
            <button
              key={shot.key}
              type="button"
              className={result.shotClassName}
              aria-label={shot.label}
              onClick={shot.onOpen}
            >
              <img className="suite-test-pane__shot-image" src={shot.src} alt="" />
            </button>
          ))}

          {result.videos.map((video) => (
            <video
              key={video.key}
              className="suite-test-pane__video"
              src={video.src}
              aria-label={video.label}
              controls
              preload="metadata"
            />
          ))}
        </motion.section>
      )}

      {hasHistory && (
        <section className="suite-test-pane__history">
          <Eyebrow>{historyLabel}</Eyebrow>
          <ul className="suite-test-pane__runs">
            {history.map((row) => (
              <li key={row.key}>
                <button
                  type="button"
                  className={row.className}
                  aria-current={row.isShown}
                  onClick={row.onShow}
                >
                  <span className={row.stateClassName}>
                    <Icon name={row.icon} label={row.word} />
                  </span>
                  <span className="suite-test-pane__run-id">{row.runId}</span>
                  <span className="suite-test-pane__run-word">{row.word}</span>
                  <span className="suite-test-pane__run-duration">{row.duration}</span>
                  <span className="suite-test-pane__run-when">{row.when}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
};
