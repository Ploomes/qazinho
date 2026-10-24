import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ProSignIn } from '@/modules/Pro/components/ProSignIn';
import { Button, Icon, Logo } from '@/shared/components/atoms';
import { useProCardViewModel } from './hooks';
import './styles.css';

/** QAzinho Pro in the settings: this computer signs in to the team's org, or shows the account and its orgs and signs out. */
export const ProCard: React.FC = () => {
  const {
    isLoading,
    isSignedIn,
    canSignIn,
    hasNoKeychain,
    subtitle,
    email,
    machine,
    isReachable,
    orgs,
    siteUrl,
    signIn,
    isSigningOut,
    onSignIn,
    onCancelSignIn,
    onCloseSignIn,
    onRetrySignIn,
    onSignOut,
  } = useProCardViewModel();
  const { t } = useTranslation();

  return (
    <div className={isSignedIn ? 'pro-card pro-card--on' : 'pro-card'}>
      <div className="pro-card__head">
        <Logo size={34} />
        <span className="pro-card__text">
          <span className="pro-card__name">QAzinho Pro</span>
          <span className="pro-card__sub">{subtitle}</span>
        </span>
      </div>

      {!isLoading && !isSignedIn && (
        <div className="pro-card__body">
          <p className="pro-card__intro">{t('PRO.INTRO')}</p>
          {hasNoKeychain && <p className="pro-card__warn">{t('PRO.NO_KEYCHAIN')}</p>}
          <div className="pro-card__actions">
            <Button variant="primary" disabled={!canSignIn} onClick={onSignIn}>
              {t('PRO.SIGN_IN')}
            </Button>
            <a className="pro-card__link" href={siteUrl} target="_blank" rel="noreferrer">
              {t('PRO.LEARN_MORE')} <Icon name="external" />
            </a>
          </div>
        </div>
      )}

      {isSignedIn && (
        <div className="pro-card__body">
          <dl className="pro-card__facts">
            <dt className="pro-card__key">{t('PRO.ACCOUNT')}</dt>
            <dd className="pro-card__value">{email}</dd>
            <dt className="pro-card__key">{t('PRO.THIS_COMPUTER')}</dt>
            <dd className="pro-card__value">{machine}</dd>
          </dl>

          <span className="pro-card__eyebrow">{t('PRO.ORGS')}</span>
          {orgs.length === 0 ? (
            <p className="pro-card__intro">{t('PRO.NO_ORGS')}</p>
          ) : (
            <ul className="pro-card__orgs">
              {orgs.map((org) => (
                <li key={org.slug} className="pro-card__org">
                  <span className="pro-card__org-name">{org.name}</span>
                  <span className="pro-card__org-role">{org.role}</span>
                  <span className={org.billingClassName}>{org.billing}</span>
                </li>
              ))}
            </ul>
          )}

          {!isReachable && <p className="pro-card__warn">{t('PRO.UNREACHABLE')}</p>}

          <div className="pro-card__actions">
            <Button variant="ghost" disabled={isSigningOut} onClick={onSignOut}>
              {t('PRO.SIGN_OUT')}
            </Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {signIn !== null && (
          <ProSignIn
            key="pro-sign-in"
            progress={signIn}
            onCancel={onCancelSignIn}
            onClose={onCloseSignIn}
            onRetry={onRetrySignIn}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
