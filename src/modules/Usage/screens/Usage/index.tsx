import { SegmentedControl } from '@/shared/components/molecules';
import { UsageChart } from './components';
import { useUsageViewModel } from './hooks';
import './styles.css';

/**
 * O que as chamadas do QAzinho ao agente do QA gastaram: o total, cada dia, os tokens e a
 * divisão por trabalho, projeto, modelo ou dia.
 */
export const Usage: React.FC = () => {
  const {
    title,
    style,
    period,
    metric,
    isLoading,
    isEmpty,
    empty,
    hero,
    agents,
    chart,
    totals,
    split,
  } = useUsageViewModel();

  return (
    <section className="usage" style={style}>
      <div className="usage__column">
        <header className="usage__head">
          <h1 className="usage__title">{title}</h1>
          <div className="usage__controls">
            {metric.isShown && (
              <SegmentedControl
                label={metric.label}
                options={metric.options}
                value={metric.value}
                onChange={metric.onChange}
              />
            )}
            <SegmentedControl
              label={period.label}
              options={period.options}
              value={period.value}
              onChange={period.onChange}
            />
          </div>
        </header>

        {isEmpty && <p className="usage__empty">{empty}</p>}

        {!isLoading && !isEmpty && (
          <>
            <div className="usage__top">
              <div className="usage__hero">
                <span className="usage__figure">{hero.value}</span>
                <span className="usage__note">{hero.note}</span>
                <ul className="usage__agents">
                  {agents.map((agent) => (
                    <li key={agent.key} className="usage__agent">
                      <span className="usage__agent-name">{agent.name}</span>
                      <span className="usage__agent-amount">{agent.amount}</span>
                      <span className="usage__agent-detail">{agent.detail}</span>
                    </li>
                  ))}
                </ul>
                {hero.unpriced !== null && (
                  <p className="usage__unpriced">{hero.unpriced}</p>
                )}
              </div>
              <UsageChart
                title={chart.title}
                action={chart.action}
                onAction={chart.onAction}
                ticks={chart.ticks}
                bars={chart.bars}
                days={chart.days}
              />
            </div>

            <section className="usage__section">
              <h2 className="usage__subtitle">{totals.title}</h2>
              <div className="usage__tiles">
                {totals.tiles.map((tile) => (
                  <div key={tile.key} className="usage__tile">
                    <span className="usage__tile-label">{tile.label}</span>
                    <span className="usage__tile-value">{tile.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="usage__section">
              <div className="usage__split-head">
                <h2 className="usage__subtitle">{split.label}</h2>
                <SegmentedControl
                  label={split.label}
                  options={split.options}
                  value={split.value}
                  onChange={split.onChange}
                />
              </div>
              <div className="usage__table" role="table">
                <div className="usage__row usage__row--head" role="row">
                  <span role="columnheader">{split.columns.name}</span>
                  <span role="columnheader" className="usage__number">
                    {split.columns.cost}
                  </span>
                  <span role="columnheader">{split.columns.share}</span>
                  <span role="columnheader" className="usage__number">
                    {split.columns.tokens}
                  </span>
                </div>
                {split.rows.map((row) => (
                  <div key={row.key} className="usage__row" role="row">
                    <span role="cell" className="usage__name">
                      {row.name}
                    </span>
                    <span role="cell" className="usage__number">
                      {row.cost}
                    </span>
                    <span role="cell" className="usage__share">
                      <span className="usage__share-track">
                        <span className="usage__share-fill" style={row.shareStyle} />
                      </span>
                      <span className="usage__share-label">{row.share}</span>
                    </span>
                    <span role="cell" className="usage__number">
                      {row.tokens}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </section>
  );
};
