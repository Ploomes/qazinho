import { useTranslation } from 'react-i18next';
import { Bugs } from '@/modules/Bug';
import { Chat } from '@/modules/Chat';
import { Plan } from '@/modules/Plan';
import { Runs } from '@/modules/Run';
import { Button, StatusPill } from '@/shared/components/atoms';
import { WorkspaceName, WorkspaceTabs } from './components';
import { useWorkspaceViewModel } from './hooks';
import './styles.css';

export const Workspace: React.FC = () => {
  const {
    hasWorkspace,
    tab,
    name,
    issueKey,
    status,
    statusLabel,
    liveStatus,
    planCount,
    runCount,
    bugCount,
    canRun,
    isLive,
    pauseLabel,
    onSelectTab,
    onRename,
    onRun,
    onPause,
    onStop,
  } = useWorkspaceViewModel();
  const { t } = useTranslation();

  if (!hasWorkspace) return null;

  return (
    <section className="workspace">
      <header className="workspace__header">
        <WorkspaceName name={name} onRename={onRename} />
        {issueKey !== null && <span className="workspace__issue">{issueKey}</span>}
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
            <Button variant="primary" disabled={!canRun} onClick={onRun}>
              {t('WORKSPACE.RUN_PLAN')}
            </Button>
          )}
        </div>
      </header>

      <div className="workspace__tabs">
        <WorkspaceTabs
          current={tab}
          planCount={planCount}
          runCount={runCount}
          bugCount={bugCount}
          onSelect={onSelectTab}
        />
      </div>

      <div className="workspace__body">
        {tab === 'chat' && <Chat />}
        {tab === 'plan' && <Plan />}
        {tab === 'runs' && <Runs />}
        {tab === 'bugs' && <Bugs />}
      </div>
    </section>
  );
};
