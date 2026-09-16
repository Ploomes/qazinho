import type { IHandoffCardProps } from './types';
import './styles.css';

/** The chat never holds the plan or the report: it hands them to their tab. */
export const HandoffCard: React.FC<IHandoffCardProps> = (props) => (
  <button type="button" className="handoff-card" onClick={props.onOpen}>
    <span
      className={
        props.isAccent === true
          ? 'handoff-card__tile handoff-card__tile--accent'
          : 'handoff-card__tile'
      }
      aria-hidden="true"
    >
      {props.glyph}
    </span>
    <span>
      <span className="handoff-card__title">{props.title}</span>
      <p className="handoff-card__subtitle">{props.subtitle}</p>
    </span>
    <span className="handoff-card__action">{props.action}</span>
  </button>
);
