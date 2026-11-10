import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button, Caret, EmptyState, Icon, StatusPill } from '@/shared/components/atoms';
import { Screenshot, ToTop, Tooltip } from '@/shared/components/molecules';
import { MOTION } from '@/shared/constants';
import { LiveRun, RunPicker } from './components';
import { useRunsViewModel } from './hooks';
import './styles.css';

export const Runs: React.FC = () => {
  const {
    runs,
    runTotal,
    current,
    run,
    title,
    canWatch,
    watchLabel,
    onWatch,
    runEnded,
    runDuration,
    factsNote,
    topRef,
    isToTopShown,
    onToTop,
    pager,
    summary,
    cases,
    live,
    isEmpty,
    onSelectRun,
    onPreviousPage,
    onNextPage,
    onOpenBug,
    onOpenShot,
  } = useRunsViewModel();
  const { t } = useTranslation();

  if (isEmpty || run === null || current === null) {
    return live !== null ? (
      <div className="runs">
        <LiveRun {...live} />
      </div>
    ) : (
      <EmptyState
        mood="sleeping"
        title={t('RUN.EMPTY_TITLE')}
        body={t('RUN.EMPTY_BODY')}
      />
    );
  }

  return (
    <div className="runs">
      {live !== null && <LiveRun {...live} />}
      <div ref={topRef} className="runs__head">
        <RunPicker
          title={title}
          current={current}
          runs={runs}
          total={runTotal}
          pager={pager}
          factsNote={factsNote}
          onSelect={onSelectRun}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
        />
        <p className="runs__summary">
          {summary.lead !== null && <span>{summary.lead}</span>}
          {summary.tallies.map((tally) => (
            <Tooltip key={tally.status} content={tally.label}>
              <span
                className={`runs__tally runs__tally--${tally.status}`}
                aria-label={tally.label}
              >
                <Icon name={tally.icon} />
                {tally.count}
              </span>
            </Tooltip>
          ))}
          {summary.bugs !== null && (
            <Tooltip content={summary.bugs.label}>
              <span className="runs__tally" aria-label={summary.bugs.label}>
                <Icon name="bug" />
                {summary.bugs.count}
              </span>
            </Tooltip>
          )}
          {runEnded !== null && (
            <Tooltip content={runEnded.label}>
              <span className="runs__ended" aria-label={runEnded.label}>
                <Icon name={runEnded.icon} />
              </span>
            </Tooltip>
          )}
          <span className="runs__facts">{runDuration}</span>
        </p>
        {canWatch && (
          <Button size="sm" onClick={onWatch}>
            <Icon name="play" /> {watchLabel}
          </Button>
        )}
      </div>

      <motion.div
        key={run.id}
        className="runs__report"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration, ease: MOTION.ease }}
      >
        <div className="runs__cases">
          {cases.map((runCase) => (
            <div key={runCase.id} className="runs__case">
              <div className="runs__case-head">
                <button
                  type="button"
                  className="runs__case-open"
                  aria-expanded={runCase.isOpen}
                  onClick={runCase.onToggle}
                >
                  <StatusPill status={runCase.verdict} label="" />
                  <span className="runs__case-name">
                    <span className="runs__case-id">{runCase.id}</span>
                    <span className="runs__case-title">{runCase.title}</span>
                  </span>
                  <Caret isOpen={runCase.isOpen} />
                </button>
                {runCase.bug !== null && (
                  <span
                    className="runs__case-bug"
                    title={runCase.bug.title}
                    aria-label={runCase.bug.title}
                  >
                    <Icon name="bug" />
                  </span>
                )}
                {runCase.take !== null && (
                  <button
                    type="button"
                    className="runs__take"
                    title={runCase.take.title}
                    aria-label={runCase.take.title}
                    onClick={runCase.take.onClick}
                  >
                    <Icon name="play" />
                    <span className="runs__take-label">{runCase.take.label}</span>
                  </button>
                )}
                {runCase.walk !== null && (
                  <span
                    className={runCase.walk.className}
                    title={runCase.walk.title}
                    aria-label={runCase.walk.title}
                  >
                    <Icon name={runCase.walk.icon} />
                  </span>
                )}
                <span className="runs__case-duration">{runCase.duration}</span>
              </div>

              <AnimatePresence initial={false}>
                {runCase.isOpen && (
                  <motion.div
                    key="steps"
                    className="runs__fold"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                  >
                    <div className="runs__steps">
                      {runCase.steps.map((step) => (
                        <div key={step.number} className="runs__step">
                          <span className="runs__step-number">{step.number}</span>
                          <span
                            className={`runs__step-icon runs__step-icon--${step.verdict}`}
                            title={step.verdictLabel}
                          >
                            {step.mark !== null && <Icon name={step.mark} />}
                          </span>

                          <div className="runs__step-body">
                            <span
                              className={
                                step.isMuted
                                  ? 'runs__step-action runs__step-action--muted'
                                  : 'runs__step-action'
                              }
                              title={step.noteTip}
                            >
                              {step.action}
                            </span>

                            {step.bug !== null && (
                              <button
                                type="button"
                                className={
                                  step.bug.isHigh
                                    ? 'runs__bug runs__bug--high'
                                    : 'runs__bug'
                                }
                                aria-label={t('RUN.OPEN_IN_BUGS')}
                                onClick={() => {
                                  onOpenBug(step.bug?.id ?? '');
                                }}
                              >
                                <span className="runs__bug-id">{step.bug.id}</span>
                                <span className="runs__bug-title">{step.bug.title}</span>
                                <Icon name="arrow" />
                              </button>
                            )}

                            {step.hasNote && (
                              <span className="runs__why">{step.note}</span>
                            )}

                            {step.asked.map((asked) => (
                              <div key={asked.key} className="runs__asked">
                                <span className="runs__asked-head">
                                  <span className="runs__asked-mark">
                                    <Icon name="ask" />
                                  </span>
                                  {t('RUN.STEP_ASKED')}
                                </span>
                                <span className="runs__asked-question">
                                  {asked.question}
                                </span>
                                <span
                                  className={
                                    asked.isAnswered
                                      ? 'runs__asked-answer'
                                      : 'runs__asked-answer runs__asked-answer--none'
                                  }
                                >
                                  {asked.isAnswered && (
                                    <span className="runs__asked-who">
                                      {t('CHAT.YOU')}
                                    </span>
                                  )}
                                  {asked.isSecret && (
                                    <span className="runs__asked-lock">
                                      <Icon name="lock" />
                                    </span>
                                  )}
                                  <span className="runs__asked-said">{asked.answer}</span>
                                </span>
                              </div>
                            ))}
                          </div>

                          <Screenshot
                            label={step.shotLabel}
                            src={step.shot}
                            file={step.shotFile}
                            onOpen={() => {
                              onOpenShot({
                                label: step.shotLabel,
                                src: step.shot,
                                file: step.shotFile,
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>

      <ToTop isShown={isToTopShown} onClick={onToTop} />
    </div>
  );
};
