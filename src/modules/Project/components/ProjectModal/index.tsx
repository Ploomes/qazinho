import { useTranslation } from 'react-i18next';
import { Button, Eyebrow, Input } from '@/shared/components/atoms';
import { FileField } from '@/shared/components/molecules';
import { ModalFrame } from '@/shared/components/templates';
import { useProjectModalViewModel } from './hooks';
import './styles.css';

export const ProjectModal: React.FC = () => {
  const {
    name,
    url,
    apk,
    app,
    isEditing,
    isConfirmingDelete,
    title,
    subtitle,
    confirmLabel,
    canConfirm,
    deleteQuestion,
    androidNote,
    xcodeNote,
    isIosAvailable,
    footerHint,
    onNameChange,
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
          <div className="project-modal__target">
            <div className="project-modal__target-head">
              <span className="project-modal__target-name">{t('PROJECT.WEB')}</span>
              <p className="project-modal__target-text">{t('PROJECT.WEB_TEXT')}</p>
            </div>
            <div className="project-modal__target-field">
              <Input
                isMono
                value={url}
                label={t('PROJECT.WEB')}
                placeholder={t('PROJECT.WEB_PLACEHOLDER')}
                onChange={onUrlChange}
              />
            </div>
          </div>

          <div className="project-modal__target">
            <div className="project-modal__target-head">
              <span className="project-modal__target-name">{t('PROJECT.ANDROID')}</span>
              <p className="project-modal__target-text">{t('PROJECT.ANDROID_TEXT')}</p>
            </div>
            <div className="project-modal__target-field">
              <FileField
                value={apk}
                label={t('PROJECT.ANDROID')}
                placeholder={t('PROJECT.ANDROID_PLACEHOLDER')}
                onPick={onPickApk}
              />
              <span className="project-modal__note">{androidNote}</span>
            </div>
          </div>

          <div
            className={
              isIosAvailable
                ? 'project-modal__target'
                : 'project-modal__target project-modal__target--off'
            }
          >
            <div className="project-modal__target-head">
              <span className="project-modal__target-name">{t('PROJECT.IOS')}</span>
              <p className="project-modal__target-text">{t('PROJECT.IOS_TEXT')}</p>
            </div>
            <div className="project-modal__target-field">
              {isIosAvailable && (
                <FileField
                  value={app}
                  label={t('PROJECT.IOS')}
                  placeholder={t('PROJECT.IOS_PLACEHOLDER')}
                  onPick={onPickApp}
                />
              )}
              <span className="project-modal__note">{xcodeNote}</span>
            </div>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
};
