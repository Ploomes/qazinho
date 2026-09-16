import { useTranslation } from 'react-i18next';
import { Eyebrow, Input, PlatformIcon } from '@/components/atoms';
import { ModalFrame } from '@/components/templates';
import { useNewWorkspaceModalViewModel } from './hooks';
import './styles.css';

export const NewWorkspaceModal: React.FC = () => {
  const {
    name,
    footerHint,
    platforms,
    projectName,
    canCreate,
    onNameChange,
    onTargetChange,
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

      <div>
        <Eyebrow>{t('NEW_WORKSPACE.PLATFORM')}</Eyebrow>
        <div className="new-workspace__platforms">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              type="button"
              className={
                platform.isChosen
                  ? 'new-workspace__platform new-workspace__platform--chosen'
                  : 'new-workspace__platform'
              }
              aria-pressed={platform.isChosen}
              onClick={() => {
                onTargetChange(platform.id);
              }}
            >
              <PlatformIcon kind={platform.kind} size={16} />
              {platform.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Eyebrow>{t('NEW_WORKSPACE.ISSUE')}</Eyebrow>
        <p className="new-workspace__issue">{t('NEW_WORKSPACE.ISSUE_EMPTY')}</p>
      </div>
    </ModalFrame>
  );
};
