import { useTranslation } from 'react-i18next';
import { Eyebrow, Input } from '@/components/atoms';
import { FileField } from '@/components/molecules';
import { ModalFrame } from '@/components/templates';
import { useProjectModalViewModel } from './hooks';
import './styles.css';

export const ProjectModal: React.FC = () => {
  const {
    name,
    url,
    apk,
    app,
    canCreate,
    androidNote,
    xcodeNote,
    isIosAvailable,
    footerHint,
    onNameChange,
    onUrlChange,
    onPickApk,
    onPickApp,
    onCancel,
    onCreate,
  } = useProjectModalViewModel();
  const { t } = useTranslation();

  return (
    <ModalFrame
      title={t('PROJECT.NEW_TITLE')}
      subtitle={t('PROJECT.NEW_SUBTITLE')}
      width={720}
      confirmLabel={t('PROJECT.CREATE')}
      canConfirm={canCreate}
      hint={footerHint}
      onCancel={onCancel}
      onConfirm={onCreate}
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
