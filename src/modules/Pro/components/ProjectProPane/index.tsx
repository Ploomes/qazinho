import type { IProjectProPaneProps } from './types';
import { Button, EmptyState, Eyebrow, Icon, Switch } from '@/shared/components/atoms';
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
    <div className="project-pro" style={view.style}>
      {view.isSignedOut && (
        <EmptyState title={view.signedOut.title} body={view.signedOut.text} />
      )}
      {view.isNoOrg && <EmptyState title={view.noOrg.title} body={view.noOrg.text} />}

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
                  <span className="project-pro__org-tile">{org.initials}</span>
                  <span className="project-pro__org-words">
                    <span className="project-pro__org-name">{org.name}</span>
                    <span className="project-pro__org-note">{org.note}</span>
                  </span>
                  <span className="project-pro__org-mark">
                    {org.isOn && <Icon name="check" />}
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

      {view.hasUnlink && (
        <header className="project-pro__head">
          <span className="project-pro__head-tile project-pro__head-tile--org">
            {view.head.initials}
          </span>
          <div className="project-pro__head-words">
            <span className="project-pro__title">{view.head.title}</span>
            <p className={view.head.stateClassName} role="status">
              {view.head.hasAlert && <Icon name="attention" />}
              {view.head.stateLine}
            </p>
          </div>
        </header>
      )}

      {view.isLinked && (
        <div className="project-pro__group">
          <Eyebrow>{view.linked.plansLabel}</Eyebrow>
          <div className="project-pro__box">
            <PaneRow
              icon={view.linked.pendingIcon}
              tone={view.linked.pendingTone}
              title={view.linked.pendingTitle}
              text={view.linked.pendingText}
            >
              {view.linked.hasPending && (
                <Button size="sm" disabled={!view.linked.canSend} onClick={view.onSend}>
                  {view.linked.sendLabel}
                </Button>
              )}
            </PaneRow>
            {view.linked.hasUpdates && (
              <PaneRow
                icon="download"
                tone="lit"
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
              <PaneRow icon="up" tone="lit" title={view.unlinked.title}>
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
              <PaneRow icon="copy" tone="plain" title={view.linked.copyTitle}>
                <Button size="sm" disabled={!view.linked.canCopy} onClick={view.onCopy}>
                  {view.linked.copyLabel}
                </Button>
              </PaneRow>
            )}
            <PaneRow
              icon="link"
              tone="plain"
              title={view.unlinkTitle}
              text={view.unlinkText}
            >
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
    </div>
  );
};
