import type { IProShareFieldProps } from './types';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@/shared/components/atoms';
import { useProShareFieldViewModel } from './hooks';
import './styles.css';

/** Where a project chooses the org of QAzinho Pro it goes to, or none, and how its last sending went. */
export const ProShareField: React.FC<IProShareFieldProps> = (props) => {
  const {
    isUnsaved,
    isLoading,
    isSignedOut,
    hasNoOrgs,
    hasOrgs,
    choices,
    state,
    isSaving,
    siteUrl,
    onOpenPro,
  } = useProShareFieldViewModel(props);
  const { t } = useTranslation();

  return (
    <div className="pro-share">
      <p className="pro-share__intro">{t('PRO.SHARE_INTRO')}</p>

      {isUnsaved && <p className="pro-share__note">{t('PRO.SHARE_UNSAVED')}</p>}

      {isLoading && <p className="pro-share__note">{t('PRO.LOADING')}</p>}

      {isSignedOut && (
        <div className="pro-share__ask">
          <p className="pro-share__note">{t('PRO.SHARE_SIGNED_OUT')}</p>
          <Button variant="secondary" onClick={onOpenPro}>
            {t('PRO.SHARE_OPEN_PRO')}
          </Button>
        </div>
      )}

      {hasNoOrgs && (
        <div className="pro-share__ask">
          <p className="pro-share__note">{t('PRO.NO_ORGS')}</p>
          <a className="pro-share__link" href={siteUrl} target="_blank" rel="noreferrer">
            {t('PRO.SUBSCRIBE')}
            <Icon name="external" />
          </a>
        </div>
      )}

      {hasOrgs && (
        <div
          className="pro-share__choices"
          role="radiogroup"
          aria-label={t('PRO.SHARE_WITH')}
          aria-busy={isSaving}
        >
          {choices.map((choice) => (
            <button
              key={choice.key}
              type="button"
              role="radio"
              aria-checked={choice.isOn}
              aria-disabled={choice.isDisabled}
              className={choice.className}
              onClick={choice.onClick}
            >
              <span className="pro-share__name">{choice.name}</span>
              <span className="pro-share__choice-note">{choice.note}</span>
            </button>
          ))}
        </div>
      )}

      {state !== null && (
        <p className={state.className}>
          <Icon name={state.icon} />
          <span>{state.label}</span>
          {state.when !== null && <span className="pro-share__when">{state.when}</span>}
        </p>
      )}
    </div>
  );
};
