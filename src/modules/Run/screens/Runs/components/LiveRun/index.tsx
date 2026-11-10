import type { ILiveRunProps } from './types';
import { Button, StatusPill } from '@/shared/components/atoms';
import './styles.css';

/** A run em curso: o caso de agora com os passos julgados, e o que espera na fila. */
export const LiveRun: React.FC<ILiveRunProps> = (props) => (
  <section className="live-run">
    <header className="live-run__head">
      <span className="live-run__pulse" />
      <h2 className="live-run__title">{props.title}</h2>
      <span className="live-run__facts">{props.facts}</span>
      <span className="live-run__grow" />
      <Button size="sm" variant="ghost" onClick={props.onWatch}>
        {props.watchLabel}
      </Button>
    </header>

    <ul className="live-run__cases">
      {props.cases.map((item) => (
        <li
          key={item.key}
          className={
            item.isWaiting ? 'live-run__case live-run__case--waiting' : 'live-run__case'
          }
        >
          <div className="live-run__case-head">
            <StatusPill status={item.status} shape="round" label="" />
            <span className="live-run__id">{item.id}</span>
            <span className="live-run__name">{item.title}</span>
            <span
              className={
                item.isNow ? 'live-run__note live-run__note--now' : 'live-run__note'
              }
            >
              {item.note}
            </span>
          </div>

          {item.steps.length > 0 && (
            <ol className="live-run__steps">
              {item.steps.map((step) => (
                <li
                  key={step.key}
                  className={
                    step.isNow ? 'live-run__step live-run__step--now' : 'live-run__step'
                  }
                >
                  <StatusPill status={step.status} shape="round" label="" />
                  <span className="live-run__number">{step.number}</span>
                  <span className="live-run__action">{step.action}</span>
                  {step.shot !== null && (
                    <button
                      type="button"
                      className="live-run__shot"
                      onClick={step.onOpen}
                    >
                      <img src={step.shot} alt="" />
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ul>
  </section>
);
