import type { IProjectProPaneProps } from './types';
import { AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { ProSignIn } from '@/modules/Pro/components/ProSignIn';
import { Button, Eyebrow, Icon, Switch } from '@/shared/components/atoms';
import { PaneRow } from './components';
import { useProjectProPaneViewModel } from './hooks';
import './styles.css';

/**
 * O vínculo de um projeto com uma org: publicá-lo numa, ou o que ele manda e o que veio
 * de lá.
 */
export const ProjectProPane: React.FC<IProjectProPaneProps> = (props) => {
  const view = useProjectProPaneViewModel(props);

  return (
    <div className="project-pro">
      {view.hasUnlink && (
        <header className="project-pro__head">
          <span className="project-pro__title">{view.head.title}</span>
          <p className={view.head.stateClassName} role="status">
            {view.head.hasAlert && <Icon name="attention" />}
            {view.head.stateLine}
          </p>
        </header>
      )}

      {view.isSignedOut && (
        <div className="project-pro__line">
          <p className="project-pro__text">{view.signInText}</p>
          <Button
            variant={view.hasUnlink ? 'secondary' : 'primary'}
            onClick={view.onSignIn}
          >
            {view.signInLabel}
          </Button>
        </div>
      )}

      {view.isNoOrg && (
        <div className="project-pro__line">
          <p className="project-pro__text">{view.noOrg.text}</p>
          <Button onClick={view.onCreateOrg}>
            {view.noOrg.action}
            <Icon name="external" />
          </Button>
        </div>
      )}

      {view.isLocal && (
        <>
          <div className="project-pro__group">
            <Eyebrow>{view.local.orgsLabel}</Eyebrow>
            <div
              className="project-pro__orgs"
              role="radiogroup"
              aria-label={view.local.orgsLabel}
            >
              {view.local.orgs.map((org) => (
                <button
                  key={org.slug}
                  type="button"
                  role="radio"
                  aria-checked={org.isOn}
                  className={org.className}
                  onClick={org.onClick}
                >
                  <span className="project-pro__radio" aria-hidden="true" />
                  <span className="project-pro__org-words">
                    <span className="project-pro__org-name">{org.name}</span>
                    <span className="project-pro__org-note">{org.note}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="project-pro__publish">
            <div className="project-pro__brief">
              <span className="project-pro__brief-line">{view.local.brief}</span>
              {view.local.filesLine !== '' && (
                <span className="project-pro__brief-line">{view.local.filesLine}</span>
              )}
              <Switch
                label={view.local.mediaSwitch}
                isOn={view.local.isMediaOn}
                onChange={view.onMediaChange}
              />
            </div>
            <Button
              variant="primary"
              disabled={!view.local.canPublish}
              onClick={view.onPublish}
            >
              {view.local.publishLabel}
            </Button>
          </div>
        </>
      )}

      {view.hasPlans && (
        <div className="project-pro__group">
          <Eyebrow>{view.linked.plansLabel}</Eyebrow>
          <div className="project-pro__box">
            <PaneRow title={view.linked.pendingTitle} text={view.linked.pendingText}>
              {view.linked.hasPending && (
                <Button size="sm" disabled={!view.linked.canSend} onClick={view.onSend}>
                  {view.linked.sendLabel}
                </Button>
              )}
            </PaneRow>
            {view.linked.hasUpdates && (
              <PaneRow
                title={view.linked.updatesTitle}
                text={view.linked.updatesText}
                note={view.linked.updatesNote}
              >
                <Button
                  size="sm"
                  disabled={!view.linked.canUpdate}
                  onClick={view.onUpdate}
                >
                  {view.linked.updateLabel}
                </Button>
              </PaneRow>
            )}
          </div>
        </div>
      )}

      {view.hasUnlink && (
        <div className="project-pro__group">
          <Eyebrow>{view.linkLabel}</Eyebrow>
          <div className="project-pro__box">
            {view.unlinked.canPublishAgain && (
              <PaneRow title={view.unlinked.title}>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!view.canUnlink}
                  onClick={view.onPublishAgain}
                >
                  {view.unlinked.label}
                </Button>
              </PaneRow>
            )}
            {view.isLinked && (
              <PaneRow title={view.linked.copyTitle}>
                <Button size="sm" disabled={!view.linked.canCopy} onClick={view.onCopy}>
                  {view.linked.copyLabel}
                </Button>
              </PaneRow>
            )}
            <PaneRow title={view.unlinkTitle} text={view.unlinkText}>
              <Button
                size="sm"
                variant="danger-quiet"
                disabled={!view.canUnlink}
                onClick={view.onUnlink}
              >
                {view.unlinkLabel}
              </Button>
            </PaneRow>
          </div>
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {view.signIn !== null && (
            <ProSignIn
              key="pro-sign-in"
              progress={view.signIn}
              onCancel={view.onCancelSignIn}
              onClose={view.onCloseSignIn}
              onRetry={view.onSignIn}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};
