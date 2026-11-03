import type { ITitlebarProps } from './types';
import { AnimatePresence } from 'motion/react';
import { AssistantButton } from '@/modules/Assistant';
import { UpdateButton } from '@/modules/Update';
import { Gauge, Icon, IconButton, Logo, Tag, Wordmark } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { ModelPopover } from '@/shared/components/organisms/ModelPopover';
import { ResourcePopover } from '@/shared/components/organisms/ResourcePopover';
import { SessionTip } from './components';
import { useTitlebarViewModel } from './hooks';
import './styles.css';

export const Titlebar: React.FC<ITitlebarProps> = (props) => {
  const {
    isBare,
    className,
    isResourcesOpen,
    isModelMenuOpen,
    resourcesLabel,
    agentLabel,
    betaLabel,
    sessionUsed,
    sessionLabel,
    sessionTip,
    onToggleResources,
    onToggleModelMenu,
  } = useTitlebarViewModel(props);

  return (
    <header className={className}>
      {!isBare && (
        <div className="titlebar__brand">
          <Logo size={24} />
          <span className="titlebar__wordmark">
            <Wordmark />
          </span>
          <span className="titlebar__beta">
            <Tag>{betaLabel}</Tag>
          </span>
        </div>
      )}

      {!isBare && (
        <div className="titlebar__meters">
          <UpdateButton />
          {sessionUsed !== null && (
            <Tooltip
              content={
                <SessionTip
                  title={sessionTip.title}
                  rows={sessionTip.rows}
                  note={sessionTip.note}
                />
              }
            >
              <span className="titlebar__session" tabIndex={0}>
                <Gauge value={sessionUsed} fills="used" label={sessionLabel ?? ''} />
                <span className="titlebar__session-label">{sessionLabel}</span>
              </span>
            </Tooltip>
          )}

          <Tooltip content={resourcesLabel} isOff={isResourcesOpen}>
            <IconButton
              icon="resources"
              label={resourcesLabel}
              isActive={isResourcesOpen}
              popup="dialog"
              onClick={onToggleResources}
            />
          </Tooltip>

          <button
            type="button"
            className="titlebar__meter-button"
            aria-haspopup="menu"
            onClick={onToggleModelMenu}
          >
            <span>{agentLabel}</span>
            <Icon name="caretDown" />
          </button>

          <span className="titlebar__assistant">
            <AssistantButton />
          </span>
        </div>
      )}

      <AnimatePresence>
        {isResourcesOpen && <ResourcePopover key="resources" />}
        {isModelMenuOpen && <ModelPopover key="model" at="titlebar" />}
      </AnimatePresence>
    </header>
  );
};
