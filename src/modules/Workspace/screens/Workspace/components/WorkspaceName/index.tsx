import type { IWorkspaceNameProps } from './types';
import { useTranslation } from 'react-i18next';
import { WORKSPACE_NAME } from './constants';
import { useWorkspaceNameViewModel } from './hooks';
import './styles.css';

/** The workspace's name in its header: a click turns it into a field in place, Enter saves and Esc lets go. */
export const WorkspaceName: React.FC<IWorkspaceNameProps> = (props) => {
  const { isEditing, draft, inputRef, onStart, onChange, onCommit, onKeyDown } =
    useWorkspaceNameViewModel(props);
  const { t } = useTranslation();

  return isEditing ? (
    <input
      ref={inputRef}
      className="workspace-name workspace-name--editing"
      value={draft}
      maxLength={WORKSPACE_NAME.maxLength}
      aria-label={t('WORKSPACE.RENAME')}
      spellCheck={false}
      onChange={onChange}
      onBlur={onCommit}
      onKeyDown={onKeyDown}
    />
  ) : (
    <h1 className="workspace-name__heading">
      <button
        type="button"
        className="workspace-name"
        title={t('WORKSPACE.RENAME')}
        onClick={onStart}
      >
        <span className="workspace-name__text">{props.name}</span>
        <svg
          className="workspace-name__pencil"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {WORKSPACE_NAME.pencil.map((path) => (
            <path key={path} d={path} />
          ))}
        </svg>
      </button>
    </h1>
  );
};
