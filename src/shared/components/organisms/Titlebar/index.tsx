import type { ITitlebarProps } from './types';
import { AnimatePresence } from 'motion/react';
import { AssistantButton } from '@/modules/Assistant';
import { UpdateButton } from '@/modules/Update';
import { IconButton } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { ResourcePopover } from '@/shared/components/organisms/ResourcePopover';
import { useTitlebarViewModel } from './hooks';
import './styles.css';

/** A barra de cima: a barra lateral, onde o QA está, e o Estagiário. */
export const Titlebar: React.FC<ITitlebarProps> = (props) => {
  const {
    isBare,
    className,
    isResourcesOpen,
    hasSidebar,
    sidebarLabel,
    onToggleSidebar,
    crumbs,
  } = useTitlebarViewModel(props);

  return (
    <header className={className}>
      {!isBare && (
        <>
          <div className="titlebar__place">
            {hasSidebar && (
              <Tooltip content={sidebarLabel}>
                <IconButton
                  icon="sidebar"
                  size="sm"
                  label={sidebarLabel}
                  onClick={onToggleSidebar}
                />
              </Tooltip>
            )}
            <nav className="titlebar__crumbs" aria-label={sidebarLabel}>
              {crumbs.map((crumb) => (
                <span key={crumb.key} className="titlebar__crumb">
                  {crumb.label}
                </span>
              ))}
            </nav>
          </div>

          <div className="titlebar__end">
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
