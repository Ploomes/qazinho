import type { IHandoffCardProps } from './types';
import './styles.css';

/** O chat nunca guarda o plano: uma linha diz que foi escrito e o abre na aba dele. */
export const HandoffCard: React.FC<IHandoffCardProps> = (props) => (
  <button
    type="button"
    className="handoff-card"
    title={props.action}
    onClick={props.onOpen}
  >
    <span className="handoff-card__title">{props.title}</span>
  </button>
);
