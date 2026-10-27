import type { IProjectProPaneProps } from './types';
import { Button, Switch } from '@/shared/components/atoms';
import { useProjectProPaneViewModel } from './hooks';
import './styles.css';

/**
 * A project's link to QAzinho Pro: publishing it to an org, or what it sends and what
 * came from there.
 */
export const ProjectProPane: React.FC<IProjectProPaneProps> = (props) => {
  const view = useProjectProPaneViewModel(props);

  return (
    <div className="project-pro">
      {view.isSignedOut && <p className="project-pro__text">{view.signedOutText}</p>}
      {view.isNoOrg && <p className="project-pro__text">{view.noOrgText}</p>}

      {view.isLocal && (
        <section className="project-pro__card">
          <span className="project-pro__title">{view.local.title}</span>
          <p className="project-pro__text">{view.local.text}</p>

          <span className="project-pro__eyebrow">{view.local.orgsLabel}</span>
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
                <span className="project-pro__org-name">{org.name}</span>
                <span className="project-pro__org-note">{org.note}</span>
              </button>
            ))}
          </div>

          {view.local.hasFacts && (
            <ul className="project-pro__facts">
              {view.local.facts.map((fact) => (
                <li key={fact} className="project-pro__fact">
                  {fact}
                </li>
              ))}
            </ul>
          )}

          <Switch
            label={view.local.mediaLabel}
            isOn={view.local.isMediaOn}
            onChange={view.onMediaChange}
          />
          <p className="project-pro__note">{view.local.mediaNote}</p>

          <div className="project-pro__actions">
            <Button disabled={!view.local.canPublish} onClick={view.onPublish}>
              {view.local.publishLabel}
            </Button>
          </div>
        </section>
      )}

      {view.isLinked && (
        <>
          <section className="project-pro__card">
            <span className="project-pro__title">{view.linked.title}</span>
            <p className="project-pro__state" role="status">
              {view.linked.stateLine}
            </p>
            <p className="project-pro__note">{view.linked.factsNote}</p>

            <p className="project-pro__text">{view.linked.pendingText}</p>
            <div className="project-pro__actions">
              <Button disabled={!view.linked.canSend} onClick={view.onSend}>
                {view.linked.sendLabel}
              </Button>
            </div>

            {view.linked.hasUpdates && (
              <>
                <p className="project-pro__text">{view.linked.updatesText}</p>
                {view.linked.hasUpdatesRunning && (
                  <p className="project-pro__note" role="status">
                    {view.linked.updatesRunningText}
                  </p>
                )}
                <div className="project-pro__actions">
                  <Button
                    variant="secondary"
                    disabled={!view.linked.canUpdate}
                    onClick={view.onUpdate}
                  >
                    {view.linked.updateLabel}
                  </Button>
                </div>
              </>
            )}
          </section>

          <section className="project-pro__card">
            <span className="project-pro__title">{view.linked.copyTitle}</span>
            <p className="project-pro__text">{view.linked.copyText}</p>
            <div className="project-pro__actions">
              <Button
                variant="secondary"
                disabled={!view.linked.canCopy}
                onClick={view.onCopy}
              >
                {view.linked.copyLabel}
              </Button>
            </div>
          </section>
        </>
      )}

      {view.isUnlinked && (
        <section className="project-pro__card">
          <p className="project-pro__state" role="status">
            {view.unlinked.text}
          </p>
          {view.unlinked.canPublishAgain && (
            <div className="project-pro__actions">
              <Button disabled={!view.canUnlink} onClick={view.onPublishAgain}>
                {view.unlinked.publishAgainLabel}
              </Button>
            </div>
          )}
        </section>
      )}

      {view.hasUnlink && (
        <section className="project-pro__card">
          <span className="project-pro__title">{view.unlinkTitle}</span>
          <p className="project-pro__text">{view.unlinkText}</p>
          <div className="project-pro__actions">
            <Button
              variant="danger-quiet"
              disabled={!view.canUnlink}
              onClick={view.onUnlink}
            >
              {view.unlinkLabel}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};
