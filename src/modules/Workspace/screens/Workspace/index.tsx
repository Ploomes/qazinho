import { Button } from '@/components/atoms';
import { Chat } from '@/modules/Chat/screens/Chat';
import { Plan } from '@/modules/Plan/screens/Plan';
import { WorkspaceTabs } from './components';
import { useWorkspaceViewModel } from './hooks';
import './styles.css';

export const Workspace: React.FC = () => {
  const {
    workspace,
    tab,
    name,
    issueKey,
    statusLabel,
    planCount,
    runCount,
    bugCount,
    canRun,
    isLive,
    onSelectTab,
    onRun,
    onPause,
    onStop,
  } = useWorkspaceViewModel();

  if (!workspace) return null;

  return (
    <section className="workspace">
      <header className="workspace__header">
        <h1 className="workspace__title">{name}</h1>
        {issueKey !== null && <span className="workspace__issue">{issueKey}</span>}
        <span className="workspace__status">{statusLabel}</span>

        <div className="workspace__actions">
          {isLive ? (
            <>
              <Button onClick={onPause}>Pause</Button>
              <Button variant="danger" onClick={onStop}>
                Stop
              </Button>
            </>
          ) : (
            <Button variant="primary" disabled={!canRun} onClick={onRun}>
              Run plan
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
      </div>
    </section>
  );
};
