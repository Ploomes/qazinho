import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ProCloneModal } from '@/modules/Pro/components/ProCloneModal';
import { ProSignIn } from '@/modules/Pro/components/ProSignIn';
import { Caret, Icon, Intern } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { STICKER } from '@/shared/constants';
import { useProAccountCardViewModel } from './hooks';
import './styles.css';

/**
 * A conta do QA no pé da sidebar: um jeito de entrar, ou a conta, as orgs dela e um jeito
 * de clonar os projetos delas.
 */
export const ProAccountCard: React.FC = () => {
  const {
    ref,
    isShown,
    isSignedIn,
    className,
    internSize,
    isOpen,
    hasTip,
    title,
    hasSubtitle,
    subtitle,
    toggleLabel,
    popup,
    isExpanded,
    initials,
    hasAttention,
    attention,
    email,
    machine,
    machineName,
    orgs,
    hasOrgs,
    isCloning,
    signIn,
    isSigningOut,
    onToggle,
    onClone,
    onCloseClone,
    onCancelSignIn,
    onCloseSignIn,
    onRetrySignIn,
    onOpenSite,
    onSignOut,
  } = useProAccountCardViewModel();
  const { t } = useTranslation();

  if (!isShown) return null;

  return (
    <div ref={ref} className={className}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="popover"
            className="pro-account__popover"
            initial={STICKER.rise.initial}
            animate={STICKER.rise.animate}
            exit={STICKER.rise.exit}
          >
            <div className="pro-account__head">
              <span className="pro-account__avatar">{initials}</span>
              <span className="pro-account__who">
                <span className="pro-account__email" title={email}>
                  {email}
                </span>
                <span className="pro-account__fact" title={machineName}>
                  {machine}
                </span>
              </span>
            </div>

            {hasAttention && <p className="pro-account__attention">{attention}</p>}

            {hasOrgs && (
              <div className="pro-account__section">
                <span className="pro-account__eyebrow">{t('PRO.ORGS')}</span>
                <ul className="pro-account__orgs">
                  {orgs.map((org) => (
                    <li key={org.slug} className="pro-account__org" title={org.role}>
                      <span className="pro-account__org-name">{org.name}</span>
                      <span
                        className={`pro-account__org-status pro-account__org-status--${org.tone}`}
                      >
                        {org.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pro-account__actions">
              {hasOrgs && (
                <button type="button" className="pro-account__action" onClick={onClone}>
                  <Icon name="download" />
                  {t('PRO.CLONE_PROJECT')}
                </button>
              )}
              <button type="button" className="pro-account__action" onClick={onOpenSite}>
                <Icon name="external" />
                {t('PRO.OPEN_SITE')}
              </button>
              <button
                type="button"
                className="pro-account__action pro-account__action--leave"
                disabled={isSigningOut}
                onClick={onSignOut}
              >
                <Icon name="back" />
                {t('PRO.SIGN_OUT')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Tooltip side="right" isOff={!hasTip} content={title}>
        <button
          type="button"
          className="pro-account__card"
          aria-haspopup={popup}
          aria-expanded={isExpanded}
          aria-label={toggleLabel}
          onClick={onToggle}
        >
          {isSignedIn ? (
            <span className="pro-account__avatar">{initials}</span>
          ) : (
            <span className="pro-account__mark">
              <Intern mood="neutral" size={internSize} isStill isFigure />
            </span>
          )}
          <span className="pro-account__text">
            <span className="pro-account__name">{title}</span>
            {hasSubtitle && <span className="pro-account__line">{subtitle}</span>}
          </span>
          {hasAttention && (
            <span className="pro-account__flag" role="img" aria-label={attention}>
              <Icon name="attention" />
            </span>
          )}
          {isSignedIn && <Caret isOpen={isOpen} />}
        </button>
      </Tooltip>

      {createPortal(
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
          {isCloning && <ProCloneModal key="pro-clone" onClose={onCloseClone} />}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};
