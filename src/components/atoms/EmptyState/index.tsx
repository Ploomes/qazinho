import type { IEmptyStateProps } from './types';
import './styles.css';

export const EmptyState: React.FC<IEmptyStateProps> = (props) => (
  <div className="empty-state">
    <div className="empty-state__title">{props.title}</div>
    <p className="empty-state__body">{props.body}</p>
    {props.action}
  </div>
);
