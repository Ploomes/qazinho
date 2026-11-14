import type { ISkillsNoteProps } from './types';
import { Icon } from '@/shared/components/atoms';
import { useSkillsNoteViewModel } from './hooks';
import './styles.css';

/** As skills do time que o agente recebeu para responder, numa linha baixa. */
export const SkillsNote: React.FC<ISkillsNoteProps> = (props) => {
  const { text } = useSkillsNoteViewModel(props);

  return (
    <p className="skills-note">
      <span className="skills-note__mark">
        <Icon name="file" />
      </span>
      <span>{text}</span>
    </p>
  );
};
