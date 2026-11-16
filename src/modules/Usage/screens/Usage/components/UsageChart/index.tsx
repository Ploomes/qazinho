import type { IUsageChartProps } from './types';
import { Tooltip } from '@/shared/components/molecules';
import './styles.css';

/** O gasto de cada dia numa coluna, com o valor de um dia na dica de cada coluna. */
export const UsageChart: React.FC<IUsageChartProps> = (props) => (
  <section className="usage-chart">
    <header className="usage-chart__head">
      <h2 className="usage-chart__title">{props.title}</h2>
      <button type="button" className="usage-chart__action" onClick={props.onAction}>
        {props.action}
      </button>
    </header>
    <div className="usage-chart__frame">
      <div className="usage-chart__axis" aria-hidden="true">
        {props.ticks.map((tick) => (
          <span key={tick.key} className="usage-chart__tick" style={tick.style}>
            {tick.label}
          </span>
        ))}
      </div>
      <div className="usage-chart__plot">
        {props.ticks.map((tick) => (
          <span key={tick.key} className="usage-chart__grid" style={tick.style} />
        ))}
        <div className="usage-chart__bars" data-tooltip-group>
          {props.bars.map((bar) => (
            <Tooltip key={bar.key} isFill content={bar.tip}>
              <span className="usage-chart__day" role="img" aria-label={bar.tip}>
                <span className={bar.className} style={bar.style} />
              </span>
            </Tooltip>
          ))}
        </div>
      </div>
      <span />
      <div className="usage-chart__days" aria-hidden="true">
        {props.days.map((day) => (
          <span key={day.key} className="usage-chart__date" style={day.style}>
            {day.label}
          </span>
        ))}
      </div>
    </div>
  </section>
);
