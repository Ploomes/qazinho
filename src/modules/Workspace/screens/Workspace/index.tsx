import { useTranslation } from 'react-i18next';
import { Chat } from '@/modules/Chat';
import { Button, Icon, IconButton, StatusPill } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { RunButton, WorkspaceName } from './components';
import { useWorkspaceViewModel } from './hooks';
import './styles.css';

export const Workspace: React.FC = () => {
  const {
    hasWorkspace,
    isHidden,
    className,
    name,
    issue,
    design,
    dropDesignLabel,
    status,
    statusLabel,
    liveStatus,
    canRun,
    canRunWithAgent,
    canExplore,
    exploreTip,
    isLive,
    pauseLabel,
    onRename,
    onDropDesign,
    onRun,
    onRunWithAgent,
    onExplore,
    onPause,
    onStop,
  } = useWorkspaceViewModel();
  const { t } = useTranslation();

  if (!hasWorkspace) return null;

  return (
    <section className={className} inert={isHidden} aria-hidden={isHidden}>
      <header className="workspace__header">
        <WorkspaceName name={name} onRename={onRename} />
        {issue !== null && (
          <a
            className="workspace__issue"
            href={issue.url}
            target="_blank"
            rel="noreferrer"
            title={issue.title}
          >
            {issue.key}
            <Icon name="external" />
          </a>
        )}
        {design !== null && (
          <span className="workspace__design">
            <a
              className="workspace__design-link"
              href={design.url}
              target="_blank"
              rel="noreferrer"
              title={design.title}
            >
              <Icon name="figma" />
              {design.name}
              <Icon name="external" />
            </a>
            <Tooltip content={dropDesignLabel}>
              <IconButton
                icon="close"
                size="sm"
                label={dropDesignLabel}
                onClick={onDropDesign}
              />
            </Tooltip>
          </span>
        )}
        {statusLabel === null ? (
          <StatusPill status={status} shape="round" />
        ) : (
          <StatusPill status={liveStatus} shape="round" label={statusLabel} />
        )}

        <div className="workspace__actions">
          {isLive ? (
            <>
              <Button onClick={onPause}>{pauseLabel}</Button>
              <Button variant="danger" onClick={onStop}>
                {t('COMMON.STOP')}
              </Button>
            </>
          ) : (
            <>
              {canExplore && (
                <Tooltip content={exploreTip}>
                  <Button variant="ghost" onClick={onExplore}>
                    {t('WORKSPACE.EXPLORE')}
                  </Button>
                </Tooltip>
              )}
              <RunButton
                canRun={canRun}
                canChoose={canRunWithAgent}
                onRun={onRun}
                onRunWithAgent={onRunWithAgent}
              />
            </>
          )}
        </div>
      </header>

      <div className="workspace__body">
        <Chat />
      </div>
    </section>
  );
};
