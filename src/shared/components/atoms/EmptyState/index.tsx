import type { IEmptyStateProps } from './types';
import { Intern } from '@/shared/components/atoms/Intern';
import './styles.css';

export const EmptyState: React.FC<IEmptyStateProps> = (props) => (
  <div className="empty-state">
    {props.mood !== undefined && <Intern mood={props.mood} size={108} />}
    <div className="empty-state__title">{props.title}</div>
    <p className="empty-state__body">{props.body}</p>
    {props.action}
  </div>
);
