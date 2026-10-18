import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Eyebrow, EmptyState, StatusPill } from '@/shared/components/atoms';
import { CountTile, Screenshot } from '@/shared/components/molecules';
import { MOTION } from '@/shared/constants';
import { useRunsViewModel } from './hooks';
import './styles.css';

export const Runs: React.FC = () => {
  const {
    runs,
    run,
    runEnded,
    reportRef,
    pager,
    counts,
    filters,
    cases,
    isEmpty,
    onSelectRun,
    onPreviousPage,
    onNextPage,
    onFilter,
    onOpenBug,
    onOpenShot,
  } = useRunsViewModel();
  const { t } = useTranslation();

  if (isEmpty || run === null) {
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
      <div ref={reportRef} className="runs__anchor">
        <motion.div
          key={run.id}
          className="runs__report"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration, ease: MOTION.ease }}
        >
          <div className="runs__head">
            <div className="runs__heading">
              <h2 className="runs__title">{run.title}</h2>
              <span className="runs__meta">
                {run.meta}
                {runEnded !== null && (
                  <span className="runs__ended">
                    <span aria-hidden="true">{runEnded.glyph}</span> {runEnded.label}
                  </span>
                )}
              </span>
            </div>

            <div className="runs__counts">
              {counts.map((item) => (
                <CountTile
                  key={item.status}
                  status={item.status}
                  glyph={item.glyph}
                  count={item.count}
                  label={item.label}
                  delay={item.delay}
                />
              ))}
            </div>
          </div>

          <div className="runs__filters">
            <Eyebrow>{t('COMMON.FILTER')}</Eyebrow>
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  item.isActive ? 'runs__filter runs__filter--active' : 'runs__filter'
                }
                onClick={() => {
                  onFilter(item.id);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="runs__cases">
            {cases.map((runCase) => (
              <div key={runCase.id} className="runs__case">
                <div className="runs__case-head">
                  <span className="runs__case-id">{runCase.id}</span>
                  <span className="runs__case-title">{runCase.title}</span>
                  <span className="runs__case-duration">{runCase.duration}</span>
                  <StatusPill status={runCase.verdict} />
                </div>

                <div className="runs__steps">
                  {runCase.steps.map((step) => (
                    <div key={step.number} className="runs__step">
                      <span className="runs__step-number">{step.number}</span>
                      <span
                        className={`runs__step-glyph runs__step-glyph--${step.verdict}`}
                        title={step.verdictLabel}
                      >
                        {step.glyph}
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
                              step.bug.isHigh ? 'runs__bug runs__bug--high' : 'runs__bug'
                            }
                            onClick={() => {
                              onOpenBug(step.bug?.id ?? '');
                            }}
                          >
                            <span className="runs__bug-mark" />
                            <span className="runs__bug-id">{step.bug.id}</span>
                            <span className="runs__bug-title">{step.bug.title}</span>
                            <span className="runs__bug-open">
                              {t('RUN.OPEN_IN_BUGS')}
                            </span>
                          </button>
                        )}

                        {step.hasNote && <span className="runs__why">{step.why}</span>}
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
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="runs__history">
        <Eyebrow>{t('RUN.HISTORY')}</Eyebrow>
        {runs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              item.isSelected
                ? 'runs__history-row runs__history-row--selected'
                : 'runs__history-row'
            }
            onClick={() => {
              onSelectRun(item.id);
            }}
          >
            <span className="runs__history-id">{item.id}</span>
            <span className="runs__history-what">{item.what}</span>
            {item.ended !== null && (
              <span className="runs__ended">
                <span aria-hidden="true">{item.ended.glyph}</span> {item.ended.label}
              </span>
            )}
            <span className="runs__tally runs__tally--passed">
              ✓ {item.counts.passed}
            </span>
            <span className="runs__tally runs__tally--failed">
              ✕ {item.counts.failed}
            </span>
            <span className="runs__tally runs__tally--blocked">
              ⊘ {item.counts.blocked}
            </span>
            <span className="runs__tally runs__tally--skipped">
              – {item.counts.skipped}
            </span>
            <span className="runs__history-when">{item.startedAt}</span>
          </button>
        ))}
        {pager.isShown && (
          <div className="runs__pager">
            <span className="runs__pager-label">{pager.label}</span>
            <button
              type="button"
              className="runs__pager-button"
              aria-label={t('RUN.PREVIOUS_PAGE')}
              disabled={!pager.canGoBack}
              onClick={onPreviousPage}
            >
              ‹
            </button>
            <button
              type="button"
              className="runs__pager-button"
              aria-label={t('RUN.NEXT_PAGE')}
              disabled={!pager.canGoOn}
              onClick={onNextPage}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
