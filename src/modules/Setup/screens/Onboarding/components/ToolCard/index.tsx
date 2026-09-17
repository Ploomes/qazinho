import type { IToolCardProps } from './types';
import './styles.css';

export const ToolCard: React.FC<IToolCardProps> = (props) => (
  <div className={`tool-card tool-card--${props.state}`}>
    <div className="tool-card__head">
      <span className="tool-card__mark" aria-hidden="true" />
      <span className="tool-card__text">
        <span className="tool-card__name">
          {props.name}
          <span className="tool-card__badge">{props.badge}</span>
        </span>
        <span className="tool-card__about">{props.about}</span>
        <span className="tool-card__detail">{props.detail}</span>
      </span>
      {props.action}
    </div>
    {props.children}
  </div>
);
