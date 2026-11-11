import type { ILastRunProps } from './types';
import { Trans } from 'react-i18next';
import { Button, Icon } from '@/shared/components/atoms';
import './styles.css';

/** A última run sob a tela dela: de quando é a tela, a run numa frase e o que falhou. */
export const LastRun: React.FC<ILastRunProps> = (props) => (
  <section className="last-run">
    <p className="last-run__caption">
      <Icon name="image" size={12} />
      {props.caption}
    </p>

    <div className="last-run__line">
      <p className="last-run__say">
        <Trans
          i18nKey={props.sayKey}
          values={props.sayValues}
          components={{ fail: <span className="last-run__failed" /> }}
        />
      </p>
      {props.canWatch && (
        <Button size="sm" variant="ghost" onClick={props.onWatch}>
          <Icon name="play" /> {props.watchLabel}
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={props.onOpenRuns}>
        {props.runsLabel}
      </Button>
    </div>

    {props.cases.length > 0 && (
      <ul className="last-run__cases">
        {props.cases.map((item) => (
          <li key={item.key}>
            <button type="button" className="last-run__case" onClick={item.onOpen}>
              <span className="last-run__mark">
                <Icon name="failed" />
              </span>
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
