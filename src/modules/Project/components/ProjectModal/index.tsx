import { useTranslation } from 'react-i18next';
import { Button, Eyebrow, Input } from '@/shared/components/atoms';
import { FileField } from '@/shared/components/molecules';
import { ModalFrame } from '@/shared/components/templates';
import { BuildFromCode, RepoField, TargetCard } from './components';
import { useProjectModalViewModel } from './hooks';
import './styles.css';

export const ProjectModal: React.FC = () => {
  const {
    name,
    url,
    apk,
    app,
    repositories,
    projectId,
    androidBuilder,
    iosBuilder,
    isEditing,
    isConfirmingDelete,
    title,
    subtitle,
    confirmLabel,
    canConfirm,
    deleteQuestion,
    androidLock,
    iosLock,
    footerHint,
    onNameChange,
    onRepositoriesChange,
    onUrlChange,
    onPickApk,
    onPickApp,
    onCancel,
    onConfirm,
    onAskDelete,
    onKeep,
    onDelete,
  } = useProjectModalViewModel();
  const { t } = useTranslation();

  return (
    <ModalFrame
      title={title}
      subtitle={subtitle}
      width={720}
      confirmLabel={confirmLabel}
      canConfirm={canConfirm}
      hint={footerHint}
      aside={
        isEditing &&
        (isConfirmingDelete ? (
          <span className="project-modal__delete">
            <span className="project-modal__delete-question">{deleteQuestion}</span>
            <Button variant="danger" size="sm" onClick={onDelete}>
              {t('PROJECT.DELETE_YES')}
            </Button>
            <Button size="sm" onClick={onKeep}>
              {t('PROJECT.DELETE_NO')}
            </Button>
          </span>
        ) : (
          <Button variant="danger-quiet" size="sm" onClick={onAskDelete}>
            {t('PROJECT.DELETE')}
          </Button>
        ))
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div>
        <Eyebrow>{t('PROJECT.NAME')}</Eyebrow>
        <Input
          value={name}
          label={t('PROJECT.NAME')}
          placeholder={t('PROJECT.NAME_PLACEHOLDER')}
          onChange={onNameChange}
        />
      </div>

      <div>
        <Eyebrow>{t('PROJECT.TARGETS')}</Eyebrow>
        <div className="project-modal__targets">
          <TargetCard name={t('PROJECT.WEB')} text={t('PROJECT.WEB_TEXT')} lock={null}>
            <Input
              isMono
              value={url}
              label={t('PROJECT.WEB')}
              placeholder={t('PROJECT.WEB_PLACEHOLDER')}
              onChange={onUrlChange}
            />
          </TargetCard>

          <TargetCard
            name={t('PROJECT.ANDROID')}
            text={t('PROJECT.ANDROID_TEXT')}
            lock={androidLock}
          >
            <FileField
              value={apk}
              label={t('PROJECT.ANDROID')}
              placeholder={t('PROJECT.ANDROID_PLACEHOLDER')}
              onPick={onPickApk}
            />
            {androidBuilder.isShown && (
              <BuildFromCode
                platform="android"
                projectId={projectId}
                repositories={repositories}
                buildId={androidBuilder.buildId}
                onStart={androidBuilder.onStart}
                onReset={androidBuilder.onReset}
              />
            )}
          </TargetCard>

          <TargetCard name={t('PROJECT.IOS')} text={t('PROJECT.IOS_TEXT')} lock={iosLock}>
            <FileField
              value={app}
              label={t('PROJECT.IOS')}
              placeholder={t('PROJECT.IOS_PLACEHOLDER')}
              onPick={onPickApp}
            />
            {iosBuilder.isShown && (
              <BuildFromCode
                platform="ios"
                projectId={projectId}
                repositories={repositories}
                buildId={iosBuilder.buildId}
                onStart={iosBuilder.onStart}
                onReset={iosBuilder.onReset}
              />
            )}
          </TargetCard>
        </div>
      </div>

      <div>
        <Eyebrow>{t('PROJECT.CODE')}</Eyebrow>
        <RepoField repositories={repositories} onChange={onRepositoriesChange} />
      </div>
    </ModalFrame>
  );
};
