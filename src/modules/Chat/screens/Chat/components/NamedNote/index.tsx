import type { INamedNoteProps } from './types';
import { Trans } from 'react-i18next';
import { Icon } from '@/shared/components/atoms';
import { useNamedNoteViewModel } from './hooks';
import './styles.css';

/** O nome que o projeto ganhou e de onde veio, numa linha baixa, com o trocar. */
export const NamedNote: React.FC<INamedNoteProps> = (props) => {
  const { textKey, name, canRename, renameLabel, onRename } =
    useNamedNoteViewModel(props);

  return (
    <p className="named-note">
      <span className="named-note__mark">
        <Icon name="edit" />
      </span>
      <span>
        <Trans
          i18nKey={textKey}
          values={{ name }}
          components={{ name: <strong className="named-note__name" /> }}
        />
        {canRename && (
          <button type="button" className="named-note__rename" onClick={onRename}>
            {renameLabel}
          </button>
        )}
      </span>
    </p>
  );
};
