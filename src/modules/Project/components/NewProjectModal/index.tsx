import { useTranslation } from 'react-i18next';
import { Eyebrow, Input } from '@/components/atoms';
import { ModalFrame } from '@/components/templates';
import { useNewProjectModalViewModel } from './hooks';
import './styles.css';

export const NewProjectModal: React.FC = () => {
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
    onApkChange,
    onAppChange,
    onCancel,
    onCreate,
  } = useNewProjectModalViewModel();
  const { t } = useTranslation();

  return (
    <ModalFrame
      title={t('PROJECT.NEW_TITLE')}
      subtitle={t('PROJECT.NEW_SUBTITLE')}
      width={740}
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
        <div className="new-project__targets">
          <div className="new-project__target">
            <span className="new-project__target-name">{t('PROJECT.WEB')}</span>
            <p className="new-project__target-text">{t('PROJECT.WEB_TEXT')}</p>
            <Input
              isMono
              value={url}
              label={t('PROJECT.WEB')}
              placeholder={t('PROJECT.WEB_PLACEHOLDER')}
              onChange={onUrlChange}
            />
          </div>

          <div className="new-project__target">
            <span className="new-project__target-name">{t('PROJECT.ANDROID')}</span>
            <p className="new-project__target-text">{t('PROJECT.ANDROID_TEXT')}</p>
            <Input
              isMono
              value={apk}
              label={t('PROJECT.ANDROID')}
              placeholder={t('PROJECT.ANDROID_PLACEHOLDER')}
              onChange={onApkChange}
            />
            <span className="new-project__note">{androidNote}</span>
          </div>

          <div
            className={
              isIosAvailable
                ? 'new-project__target'
                : 'new-project__target new-project__target--off'
            }
          >
            <span className="new-project__target-name">{t('PROJECT.IOS')}</span>
            <p className="new-project__target-text">{t('PROJECT.IOS_TEXT')}</p>
            {isIosAvailable && (
              <Input
                isMono
                value={app}
                label={t('PROJECT.IOS')}
                placeholder={t('PROJECT.IOS_PLACEHOLDER')}
                onChange={onAppChange}
              />
            )}
            <span className="new-project__note">{xcodeNote}</span>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
};
