import type { IFindingNoteProps } from './types';
import { useTranslation } from 'react-i18next';
import { useFindingNoteViewModel } from './hooks';
import './styles.css';

/** A bug the run's agent filed on the side of a step, in the run's section, one click from Bugs. */
export const FindingNote: React.FC<IFindingNoteProps> = (props) => {
  const { onOpen } = useFindingNoteViewModel(props);
  const { t } = useTranslation();

  return (
    <button type="button" className="finding-note" onClick={onOpen}>
      <span className="finding-note__mark" aria-hidden="true" />
      <span className="finding-note__id">{props.message.bugId}</span>
      <span className="finding-note__title">{props.message.title}</span>
      <span className="finding-note__tag">{t('BUG.OUTSIDE_PLAN')}</span>
      <span className="finding-note__open">{t('RUN.OPEN_IN_BUGS')}</span>
    </button>
  );
};
