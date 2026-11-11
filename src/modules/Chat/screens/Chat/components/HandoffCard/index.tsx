import type { IHandoffCardProps } from './types';
import { Icon } from '@/shared/components/atoms';
import './styles.css';

/** O chat nunca guarda o plano: uma linha diz que foi escrito e o abre na aba dele. */
export const HandoffCard: React.FC<IHandoffCardProps> = (props) => (
  <button type="button" className="handoff-card" onClick={props.onOpen}>
    <span className="handoff-card__title">{props.title}</span>
    <span className="handoff-card__rule" aria-hidden="true" />
    <span className="handoff-card__action">
      {props.action}
      <span className="handoff-card__arrow">
        <Icon name="arrow" />
      </span>
    </span>
  </button>
);
