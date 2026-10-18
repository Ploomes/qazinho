import type { IVerdictNoteProps } from './types';
import { StatusPill } from '@/shared/components/atoms';
import { ExpectedGot } from '@/shared/components/molecules';
import { useVerdictNoteViewModel } from './hooks';
import './styles.css';

export const VerdictNote: React.FC<IVerdictNoteProps> = (props) => {
  const { title, hasEvidence } = useVerdictNoteViewModel(props);
  const { message } = props;

  return (
    <div className="verdict-note">
      <div className="verdict-note__head">
        <StatusPill status={message.verdict} />
        <span className="verdict-note__text">{title}</span>
      </div>
      {hasEvidence && (
        <ExpectedGot expected={message.expected ?? ''} got={message.got ?? ''} />
      )}
    </div>
  );
};
