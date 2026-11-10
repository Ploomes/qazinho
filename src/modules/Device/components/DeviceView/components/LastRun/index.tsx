import type { ILastRunProps } from './types';
import { Button, Icon } from '@/shared/components/atoms';
import './styles.css';

/** A última run sob a tela dela: quando foi, quantos falharam e cada caso que falhou. */
export const LastRun: React.FC<ILastRunProps> = (props) => (
  <section className="last-run">
    <header className="last-run__head">
      <h2 className="last-run__title">{props.title}</h2>
      <span className="last-run__facts">{props.facts}</span>
      <span className="last-run__grow" />
      {props.canWatch && (
        <Button size="sm" variant="ghost" onClick={props.onWatch}>
          <Icon name="play" /> {props.watchLabel}
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={props.onOpenRuns}>
        {props.runsLabel}
      </Button>
    </header>

    <p className="last-run__sum">
      {props.failedLabel !== '' && (
        <span className="last-run__failed">{props.failedLabel}</span>
      )}
      {props.passedLabel !== '' && (
        <span className="last-run__passed">{props.passedLabel}</span>
      )}
      <span className="last-run__where">{props.where}</span>
    </p>

    {props.cases.length > 0 && (
      <ul className="last-run__cases">
        {props.cases.map((item) => (
          <li key={item.key}>
            <button type="button" className="last-run__case" onClick={item.onOpen}>
              <span className="last-run__dot" />
              <span className="last-run__id">{item.id}</span>
              <span className="last-run__name">{item.title}</span>
              <span className="last-run__link">
                {item.linkLabel}
                <Icon name="arrow" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    )}
  </section>
);
