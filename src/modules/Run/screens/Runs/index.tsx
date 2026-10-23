import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button, Caret, EmptyState, Icon, StatusPill } from '@/shared/components/atoms';
import { Screenshot } from '@/shared/components/molecules';
import { MOTION } from '@/shared/constants';
import { RunPicker } from './components';
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
    runFacts,
    factsNote,
    topRef,
    showsToTop,
    onToTop,
    pager,
    summary,
    passedLabel,
    cases,
    isEmpty,
    onSelectRun,
    onPreviousPage,
    onNextPage,
    onOpenBug,
    onOpenShot,
  } = useRunsViewModel();
  const { t } = useTranslation();

  if (isEmpty || run === null || current === null) {
    return (
      <EmptyState
        mood="sleeping"
        title={t('RUN.EMPTY_TITLE')}
        body={t('RUN.EMPTY_BODY')}
      />
    );
  }

  return (
    <div className="runs">
      <div ref={topRef} className="runs__top">
        <RunPicker
          current={current}
          runs={runs}
          total={runTotal}
          pager={pager}
          factsNote={factsNote}
          onSelect={onSelectRun}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
        />
      </div>

      <motion.div
        key={run.id}
        className="runs__report"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration, ease: MOTION.ease }}
      >
        <div className="runs__head">
          <div className="runs__heading">
            <div className="runs__title-row">
              <h2 className="runs__title">{title}</h2>
              {canWatch && (
                <Button size="sm" variant="primary" onClick={onWatch}>
                  <Icon name="play" /> {watchLabel}
                </Button>
              )}
            </div>
            <p className="runs__summary">
              <span className="runs__summary-lead">{summary.lead}</span>
              {summary.tallies.map((tally) => (
                <span
                  key={tally.status}
                  className={`runs__tally runs__tally--${tally.status}`}
                >
                  <Icon name={tally.icon} /> {tally.label}
                </span>
              ))}
              {summary.bugs !== null && (
                <span className="runs__tally runs__tally--bugs">
                  <Icon name="bug" /> {summary.bugs}
                </span>
              )}
            </p>
            <span className="runs__meta">
              {run.meta}
              <span className="runs__facts" title={factsNote}>
                {runFacts}
              </span>
              {runEnded !== null && (
                <span className="runs__ended">
                  <Icon name={runEnded.icon} /> {runEnded.label}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="runs__cases">
          {cases.map((runCase) => (
            <div key={runCase.id} className="runs__case-slot">
              {runCase.isFirstPassed && (
                <span className="runs__group">{passedLabel}</span>
              )}
              <div className="runs__case">
                <div className="runs__case-head">
                  <button
                    type="button"
                    className="runs__case-open"
                    aria-expanded={runCase.isOpen}
                    onClick={runCase.onToggle}
                  >
                    <Caret isOpen={runCase.isOpen} />
                    <span className="runs__case-id">{runCase.id}</span>
                    <span className="runs__case-title">{runCase.title}</span>
                  </button>
                  {runCase.take !== null && (
                    <button
                      type="button"
                      className="runs__take"
                      title={runCase.take.title}
                      aria-label={runCase.take.title}
                      onClick={runCase.take.onClick}
                    >
                      <Icon name="play" /> {runCase.take.label}
                    </button>
                  )}
                  {runCase.walk !== null && (
                    <span className={runCase.walk.className} title={runCase.walk.title}>
                      {runCase.walk.label}
                    </span>
                  )}
                  <span className="runs__case-duration">{runCase.duration}</span>
                  <StatusPill status={runCase.verdict} />
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
                                  onClick={() => {
                                    onOpenBug(step.bug?.id ?? '');
                                  }}
                                >
                                  <span className="runs__bug-mark" />
                                  <span className="runs__bug-id">{step.bug.id}</span>
                                  <span className="runs__bug-title">
                                    {step.bug.title}
                                  </span>
                                  <span className="runs__bug-open">
                                    {t('RUN.OPEN_IN_BUGS')}
                                    <Icon name="arrow" />
                                  </span>
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
                                    <span className="runs__asked-said">
                                      {asked.answer}
                                    </span>
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
            </div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {showsToTop && (
          <motion.button
            key="to-top"
            type="button"
            className="runs__to-top"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            onClick={onToTop}
          >
            <Icon name="up" /> {t('RUN.TO_TOP')}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
