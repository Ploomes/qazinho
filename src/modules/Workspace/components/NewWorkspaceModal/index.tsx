import { useTranslation } from 'react-i18next';
import { Button, Eyebrow, Input, PlatformIcon } from '@/shared/components/atoms';
import { ModalFrame } from '@/shared/components/templates';
import { useNewWorkspaceModalViewModel } from './hooks';
import './styles.css';

export const NewWorkspaceModal: React.FC = () => {
  const {
    name,
    footerHint,
    hasPlatforms,
    platforms,
    projectName,
    canCreate,
    issueText,
    canConnect,
    connectLabel,
    onConnect,
    onNameChange,
    onCancel,
    onCreate,
  } = useNewWorkspaceModalViewModel();
  const { t } = useTranslation();

  return (
    <ModalFrame
      title={t('NEW_WORKSPACE.TITLE')}
      subtitle={t('NEW_WORKSPACE.SUBTITLE', { project: projectName })}
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

      <div className="new-workspace__issue">
        <p className="new-workspace__issue-text">{issueText}</p>
        {canConnect && (
          <Button size="sm" variant="ghost" onClick={onConnect}>
            {connectLabel}
          </Button>
        )}
      </div>
    </ModalFrame>
  );
};
