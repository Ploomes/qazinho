import { useTranslation } from 'react-i18next';
import {
  Button,
  Eyebrow,
  Icon,
  IconButton,
  Input,
  PlatformIcon,
} from '@/shared/components/atoms';
import { ModalFrame } from '@/shared/components/templates';
import { ImportField } from './components';
import { useNewWorkspaceModalViewModel } from './hooks';
import './styles.css';

export const NewWorkspaceModal: React.FC = () => {
  const {
    name,
    folder,
    canStory,
    isStory,
    canImport,
    storyLabel,
    storyOnLabel,
    storyRemoveLabel,
    onStory,
    onFolderChange,
    footerHint,
    hasPlatforms,
    platforms,
    canCreate,
    onNameChange,
    onCancel,
    onCreate,
  } = useNewWorkspaceModalViewModel();
  const { t } = useTranslation();

  return (
    <ModalFrame
      title={t('NEW_WORKSPACE.TITLE')}
      width={520}
      confirmLabel={t('NEW_WORKSPACE.CREATE')}
      canConfirm={canCreate}
      hint={footerHint}
      onCancel={onCancel}
      onConfirm={onCreate}
    >
      <div>
        <Eyebrow>{t('NEW_WORKSPACE.NAME')}</Eyebrow>
        <Input
          value={name}
          label={t('NEW_WORKSPACE.NAME')}
          placeholder={t('NEW_WORKSPACE.NAME_PLACEHOLDER')}
          onChange={onNameChange}
        />
      </div>

      {hasPlatforms && (
        <div>
          <Eyebrow>{t('NEW_WORKSPACE.PLATFORM')}</Eyebrow>
          <div className="new-workspace__platforms">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                type="button"
                className={platform.className}
                aria-pressed={platform.isChosen}
                onClick={platform.onClick}
              >
                <PlatformIcon kind={platform.kind} size={16} />
                {platform.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {canStory &&
        (isStory ? (
          <div className="new-workspace__story">
            <Icon name="story" />
            <span className="new-workspace__story-text">{storyOnLabel}</span>
            <IconButton
              icon="close"
              size="sm"
              label={storyRemoveLabel}
              onClick={onStory}
            />
          </div>
        ) : (
          <span className="new-workspace__story-pick">
            <Button size="sm" variant="ghost" onClick={onStory}>
              <Icon name="story" /> {storyLabel}
            </Button>
          </span>
        ))}

      {canImport && <ImportField folder={folder} onChange={onFolderChange} />}
    </ModalFrame>
  );
};
