import { useTranslation } from 'react-i18next';
import { Button, StatusPill } from '@/components/atoms';
import { Bugs } from '@/modules/Bug/screens/Bugs';
import { Chat } from '@/modules/Chat/screens/Chat';
import { Plan } from '@/modules/Plan/screens/Plan';
import { Runs } from '@/modules/Run/screens/Runs';
import { WorkspaceTabs } from './components';
import { useWorkspaceViewModel } from './hooks';
import './styles.css';

export const Workspace: React.FC = () => {
  const {
    workspace,
    tab,
    name,
    issueKey,
    status,
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
  const { t } = useTranslation();

  if (!workspace) return null;

  return (
    <section className="workspace">
      <header className="workspace__header">
        <h1 className="workspace__title">{name}</h1>
        {issueKey !== null && <span className="workspace__issue">{issueKey}</span>}
        {statusLabel === null ? (
          <StatusPill status={status} shape="round" />
        ) : (
          <StatusPill status="running" shape="round" label={statusLabel} />
        )}

        <div className="workspace__actions">
          {isLive ? (
            <>
              <Button onClick={onPause}>{t('COMMON.PAUSE')}</Button>
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
