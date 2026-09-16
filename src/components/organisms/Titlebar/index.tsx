import { AnimatePresence } from 'motion/react';
import { Gauge, Logo, Meter } from '@/components/atoms';
import { Tooltip } from '@/components/molecules';
import { ModelPopover } from '@/components/organisms/ModelPopover';
import { ResourcePopover } from '@/components/organisms/ResourcePopover';
import { SessionTip } from './components';
import { useTitlebarViewModel } from './hooks';
import './styles.css';

export const Titlebar: React.FC = () => {
  const {
    isMac,
    isResourcesOpen,
    isModelMenuOpen,
    cpuLabel,
    cpuShare,
    ramLabel,
    processLabel,
    agentLabel,
    contextShare,
    contextLabel,
    sessionLeft,
    sessionLabel,
    sessionTip,
    onToggleResources,
    onToggleModelMenu,
  } = useTitlebarViewModel();

  return (
    <header className={isMac ? 'titlebar titlebar--mac' : 'titlebar'}>
      <div className="titlebar__brand">
        <Logo />
        <span className="titlebar__wordmark">gocrash</span>
      </div>

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
          <span aria-hidden="true">·</span>
          <span>{processLabel}</span>
        </button>

        {sessionLeft !== null && (
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
              <Gauge value={sessionLeft} label={sessionLabel ?? ''} />
              <span>{sessionLabel}</span>
            </span>
          </Tooltip>
        )}

        <button
          type="button"
          className="titlebar__meter-button"
          aria-haspopup="menu"
          onClick={onToggleModelMenu}
        >
          {contextShare !== null && (
            <Tooltip content={<span className="titlebar__tip">{contextLabel}</span>}>
              <Gauge value={contextShare} label={contextLabel} fills="used" />
            </Tooltip>
          )}
          <span>{agentLabel}</span>
          <span aria-hidden="true">▾</span>
        </button>
      </div>

      <AnimatePresence>
        {isResourcesOpen && <ResourcePopover key="resources" />}
        {isModelMenuOpen && <ModelPopover key="model" at="titlebar" />}
      </AnimatePresence>
    </header>
  );
};
