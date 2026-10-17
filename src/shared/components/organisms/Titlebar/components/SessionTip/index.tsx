import type { ISessionTipProps } from './types';
import './styles.css';

export const SessionTip: React.FC<ISessionTipProps> = (props) => (
  <span className="session-tip">
    <span className="session-tip__title">{props.title}</span>

    {props.rows.map((row) => (
      <span key={row.id} className="session-tip__row">
        <span className="session-tip__line">
          <span className="session-tip__label">{row.label}</span>
          <span className="session-tip__value">{row.value}</span>
        </span>
        <span className="session-tip__bar">
          <span className="session-tip__fill" style={{ width: row.fillWidth }} />
        </span>
        {row.detail !== null && <span className="session-tip__detail">{row.detail}</span>}
      </span>
    ))}

    <span className="session-tip__note">{props.note}</span>
  </span>
);
