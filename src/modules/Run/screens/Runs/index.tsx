import { useTranslation } from 'react-i18next';
import { Eyebrow, EmptyState, StatusPill } from '@/components/atoms';
import { CountTile, Screenshot } from '@/components/molecules';
import { useRunsViewModel } from './hooks';
import './styles.css';

export const Runs: React.FC = () => {
  const {
    runs,
    run,
    filters,
    filter,
    cases,
    isEmpty,
    onSelectRun,
    onFilter,
    onOpenBug,
    onOpenShot,
  } = useRunsViewModel();
  const { t } = useTranslation();

  if (isEmpty || run === null) {
    return <EmptyState title={t('RUN.EMPTY_TITLE')} body={t('RUN.EMPTY_BODY')} />;
  }

  return (
    <div className="runs">
      <Eyebrow>{t('RUN.HISTORY')}</Eyebrow>
      <div className="runs__history">
        {runs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              item.id === run.id
                ? 'runs__history-row runs__history-row--selected'
                : 'runs__history-row'
            }
            onClick={() => {
              onSelectRun(item.id);
            }}
          >
            <span className="runs__history-id">{item.id}</span>
            <span>{item.what}</span>
            <span className="runs__history-counts">
              ✓{item.counts.passed} ✕{item.counts.failed} ⊘{item.counts.blocked} –
              {item.counts.skipped}
            </span>
          </button>
        ))}
      </div>

      <div className="runs__report">
        <div>
          <h2 className="runs__title">{run.title}</h2>
          <span className="runs__meta">{run.meta}</span>
        </div>

        <div className="runs__counts">
          <CountTile status="passed" count={run.counts.passed} label={t('RUN.PASSED')} />
          <CountTile status="failed" count={run.counts.failed} label={t('RUN.FAILED')} />
          <CountTile
            status="blocked"
            count={run.counts.blocked}
            label={t('RUN.BLOCKED')}
          />
          <CountTile
            status="skipped"
            count={run.counts.skipped}
            label={t('RUN.SKIPPED')}
          />
        </div>

        <div className="runs__filters">
          <Eyebrow>{t('COMMON.FILTER')}</Eyebrow>
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={
                item === filter ? 'runs__filter runs__filter--active' : 'runs__filter'
              }
              onClick={() => {
                onFilter(item);
              }}
            >
              {t(`RUN.${item.toUpperCase()}` as never)}
            </button>
          ))}
        </div>

        {cases.map((runCase) => (
          <div key={runCase.id} className="runs__case">
            <div className="runs__case-head">
              <span className="runs__step-number">{runCase.id}</span>
              <span>{runCase.title}</span>
              <StatusPill status={runCase.verdict} />
            </div>

            {runCase.steps.map((step) => (
              <div key={step.number} className="runs__step">
                <span className="runs__step-number">{step.number}</span>
                <StatusPill status={step.verdict} label="" />
                <span>{step.action}</span>
                {step.bugId !== null && (
                  <button
                    type="button"
                    className="runs__bug-link"
                    onClick={() => {
                      onOpenBug(step.bugId ?? '');
                    }}
                  >
                    {t('RUN.OPEN_IN_BUGS')}
                  </button>
                )}
                <Screenshot
                  label={`step ${String(step.number)}`}
                  src={step.shot}
                  file={step.shotFile}
                  onOpen={() => {
                    onOpenShot({
                      label: `step ${String(step.number)}`,
                      src: step.shot,
                      file: step.shotFile,
                    });
                  }}
                />
                {step.why !== null && <span className="runs__why">{step.why}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
