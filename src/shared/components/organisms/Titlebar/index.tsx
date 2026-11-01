import type { ITitlebarProps } from './types';
import { AnimatePresence } from 'motion/react';
import { Gauge, Icon, Logo, Meter, Tag, Wordmark } from '@/shared/components/atoms';
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
    cpuLabel,
    cpuShare,
    ramLabel,
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
          <button
            type="button"
            className="titlebar__meter-button"
            aria-haspopup="dialog"
            onClick={onToggleResources}
          >
            <Meter value={cpuShare} label="CPU" />
            <span>{cpuLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{ramLabel}</span>
          </button>

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

          <button
            type="button"
            className="titlebar__meter-button"
            aria-haspopup="menu"
            onClick={onToggleModelMenu}
          >
            <span>{agentLabel}</span>
            <Icon name="caretDown" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {isResourcesOpen && <ResourcePopover key="resources" />}
        {isModelMenuOpen && <ModelPopover key="model" at="titlebar" />}
      </AnimatePresence>
    </header>
  );
};
