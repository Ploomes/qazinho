import type { IPaneRowProps } from './types';
import { PROJECT_PRO_PANE } from '@/modules/Pro/components/ProjectProPane/constants';
import { Icon } from '@/shared/components/atoms';
import './styles.css';

/** One thing the project's link holds: what it says, and its action on the right. */
export const PaneRow: React.FC<IPaneRowProps> = (props) => (
  <div className={`pane-row pane-row--${props.tone}`}>
    <span className="pane-row__tile">
      <Icon name={props.icon} size={PROJECT_PRO_PANE.rowIconPx} />
    </span>
    <div className="pane-row__words">
      <span className="pane-row__title">{props.title}</span>
      <p className="pane-row__text">{props.text}</p>
      {props.note !== undefined && (
        <p className="pane-row__note" role="status">
          <Icon name="running" />
          {props.note}
        </p>
      )}
    </div>
    <div className="pane-row__action">{props.children}</div>
  </div>
);
