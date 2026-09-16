import { AnimatePresence } from 'motion/react';
import { Gauge, Logo, Meter } from '@/components/atoms';
import { ModelPopover } from '@/components/organisms/ModelPopover';
import { ResourcePopover } from '@/components/organisms/ResourcePopover';
import { useTitlebarViewModel } from './hooks';
import './styles.css';

export const Titlebar: React.FC = () => {
  const {
    projectName,
    hasProjects,
    isMac,
    isResourcesOpen,
    isModelMenuOpen,
    cpuLabel,
    cpuShare,
    ramLabel,
    processLabel,
    agentLabel,
    sessionLeft,
    sessionLabel,
    sessionTitle,
    onToggleResources,
    onToggleModelMenu,
  } = useTitlebarViewModel();

  return (
    <header className={isMac ? 'titlebar titlebar--mac' : 'titlebar'}>
      <div className="titlebar__brand">
        <Logo />
        <span className="titlebar__wordmark">gocrash</span>
      </div>

      {hasProjects && (
        <button type="button" className="titlebar__project">
          {projectName}
          <span aria-hidden="true">▾</span>
        </button>
      )}

      <div className="titlebar__meters">
        <button
          type="button"
          className="titlebar__meter-button"
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
          <span className="titlebar__session" title={sessionTitle}>
            <Gauge value={sessionLeft} label={sessionLabel ?? ''} />
            <span>{sessionLabel}</span>
          </span>
        )}

        <button
          type="button"
          className="titlebar__meter-button"
          onClick={onToggleModelMenu}
        >
          <span>{agentLabel}</span>
          <span aria-hidden="true">▾</span>
        </button>
      </div>

      <AnimatePresence>
        {isResourcesOpen && <ResourcePopover key="resources" />}
        {isModelMenuOpen && <ModelPopover key="model" />}
      </AnimatePresence>
    </header>
  );
};
