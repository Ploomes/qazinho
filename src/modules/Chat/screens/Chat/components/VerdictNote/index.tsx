import type { IVerdictNoteProps } from './types';
import { StatusPill } from '@/shared/components/atoms';
import { ExpectedGot } from '@/shared/components/molecules';
import './styles.css';

export const VerdictNote: React.FC<IVerdictNoteProps> = ({ message }) => (
  <div className="verdict-note">
    <div className="verdict-note__head">
      <StatusPill status={message.verdict} />
      <span className="verdict-note__text">{message.text}</span>
    </div>
    {message.expected !== null && message.got !== null && (
      <ExpectedGot expected={message.expected} got={message.got} />
    )}
  </div>
);
