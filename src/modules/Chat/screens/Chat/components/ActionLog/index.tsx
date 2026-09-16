import type { IActionLogProps } from './types';
import { Eyebrow } from '@/components/atoms';
import './styles.css';

export const ActionLog: React.FC<IActionLogProps> = (props) => (
  <div className="action-log">
    <Eyebrow>{props.message.actions.length} actions on the device</Eyebrow>
    {props.message.actions.map((action) => (
      <div key={`${action.at}-${action.what}`} className="action-log__row">
        <span aria-hidden="true">›</span>
        <span>{action.what}</span>
        <span className="action-log__at">{action.at}</span>
      </div>
    ))}
  </div>
);
