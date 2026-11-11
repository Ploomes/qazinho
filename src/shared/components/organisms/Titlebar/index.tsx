import type { ITitlebarProps } from './types';
import { AnimatePresence } from 'motion/react';
import { AssistantButton } from '@/modules/Assistant';
import { UpdateButton } from '@/modules/Update';
import { PlanActions } from '@/modules/Workspace';
import { ResourcePopover } from '@/shared/components/organisms/ResourcePopover';
import { useTitlebarViewModel } from './hooks';
import './styles.css';

/** A barra de cima: onde o QA está, as ações do plano e o Estagiário. */
export const Titlebar: React.FC<ITitlebarProps> = (props) => {
  const { isBare, className, isResourcesOpen, crumbs, crumbsLabel, hasPlanActions } =
    useTitlebarViewModel(props);

  return (
    <header className={className}>
      {!isBare && (
        <>
          <div className="titlebar__place">
            <nav className="titlebar__crumbs" aria-label={crumbsLabel}>
              {crumbs.map((crumb) => (
                <span key={crumb.key} className="titlebar__crumb">
                  {crumb.label}
                </span>
              ))}
            </nav>
          </div>

          <div className="titlebar__end">
            {hasPlanActions && <PlanActions />}
            <UpdateButton />
            <AssistantButton />
          </div>
        </>
      )}

      <AnimatePresence>
        {isResourcesOpen && <ResourcePopover key="resources" />}
      </AnimatePresence>
    </header>
  );
};
