import type { IProCloneModalProps } from './types';
import { Icon, Input } from '@/shared/components/atoms';
import { ModalFrame } from '@/shared/components/templates';
import { useProCloneModalViewModel } from './hooks';
import './styles.css';

/**
 * Acha um projeto de uma das orgs da pessoa e o clona para este computador, ligado a essa
 * org.
 */
export const ProCloneModal: React.FC<IProCloneModalProps> = (props) => {
  const view = useProCloneModalViewModel(props);

  return (
    <ModalFrame
      title={view.title}
      subtitle={view.subtitle}
      width={560}
      confirmLabel={view.confirmLabel}
      canConfirm
      onCancel={view.onCancel}
      onConfirm={view.onConfirm}
    >
      <div className="pro-clone">
        {view.hasOrgChoice && (
          <div className="pro-clone__orgs" role="radiogroup" aria-label={view.orgsLabel}>
            {view.orgs.map((org) => (
              <button
                key={org.slug}
                type="button"
                role="radio"
                aria-checked={org.isOn}
                className={org.className}
                onClick={org.onClick}
              >
                {org.name}
              </button>
            ))}
          </div>
        )}

        <Input
          isAutoFocused
          value={view.query}
          label={view.searchLabel}
          placeholder={view.placeholder}
          onChange={view.onQuery}
        />

        {view.note !== null && <p className="pro-clone__note">{view.note}</p>}

        <ul className="pro-clone__projects">
          {view.projects.map((project) => (
            <li key={project.id} className="pro-clone__project">
              <span className="pro-clone__text">
                <span className="pro-clone__name">{project.name}</span>
                <span className="pro-clone__meta">
                  {project.code}, {project.meta}
                </span>
                {project.failure !== null && (
                  <span className="pro-clone__failure" role="alert">
                    {project.failure}
                  </span>
                )}
              </span>
              {project.isHere ? (
                <span className="pro-clone__here">{project.hereLabel}</span>
              ) : (
                <button
                  type="button"
                  className="pro-clone__action"
                  disabled={project.isWorking}
                  onClick={project.onClone}
                >
                  <Icon name="download" />
                  {project.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </ModalFrame>
  );
};
