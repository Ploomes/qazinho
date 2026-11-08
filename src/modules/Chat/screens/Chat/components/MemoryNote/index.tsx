import type { IMemoryNoteProps } from './types';
import { Icon } from '@/shared/components/atoms';
import { useMemoryNoteViewModel } from './hooks';
import './styles.css';

/** O que o agente aprendeu ou corrigiu sobre o app, uma linha baixa por mudança. */
export const MemoryNote: React.FC<IMemoryNoteProps> = (props) => {
  const { lines } = useMemoryNoteViewModel(props);

  return (
    <ul className="memory-note">
      {lines.map(({ key, text }) => (
        <li key={key} className="memory-note__line">
          <span className="memory-note__mark">
            <Icon name="memory" />
          </span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
};
