import { useTranslation } from 'react-i18next';
import { Bugs } from '@/modules/Bug';
import { DeviceView } from '@/modules/Device';
import { Plan } from '@/modules/Plan';
import { Runs } from '@/modules/Run';
import { Button, Icon, StatusPill } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { ErrorBarrier } from '@/shared/components/organisms';
import { PanelTabs, RunButton, TargetChip, WorkspaceName } from './components';
import { useWorkspaceViewModel } from './hooks';
import './styles.css';

export const Workspace: React.FC = () => {
  const {
    hasWorkspace,
    style,
    tab,
    planCount,
    runCount,
    bugCount,
    name,
    issue,
    design,
    dropDesignLabel,
    status,
    statusLabel,
    hasStatus,
    liveStatus,
    canRun,
    canRunWithAgent,
    developedCount,
    toDevelopCount,
    toContinueCount,
    canExplore,
    exploreTip,
    isLive,
    pauseLabel,
    onSelectTab,
    onRename,
    onDropDesign,
    onRun,
    onRunPlan,
    onRunDeveloped,
    onRunWithAgent,
    onExplore,
    onPause,
    onStop,
  } = useWorkspaceViewModel();
  const { t } = useTranslation();

  if (!hasWorkspace) return null;

  return (
    <section className="workspace" style={style}>
      <header className="workspace__header">
        <div className="workspace__title">
          <WorkspaceName name={name} onRename={onRename} />

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
                  developed={developedCount}
                  toDevelop={toDevelopCount}
                  toContinue={toContinueCount}
                  onRun={onRun}
                  onRunPlan={onRunPlan}
                  onRunDeveloped={onRunDeveloped}
                  onRunWithAgent={onRunWithAgent}
                />
              </>
            )}
          </div>
        </div>

        <div className="workspace__context">
          {hasStatus &&
            (statusLabel === null ? (
              <StatusPill status={status} shape="round" />
            ) : (
              <StatusPill status={liveStatus} shape="round" label={statusLabel} />
            ))}

          <TargetChip />

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
                <button
                  type="button"
                  className="workspace__design-drop"
                  aria-label={dropDesignLabel}
                  onClick={onDropDesign}
                >
                  <Icon name="close" />
                </button>
              </Tooltip>
            </span>
          )}
        </div>
      </header>

      <div className="workspace__tabs">
        <PanelTabs
          current={tab}
          planCount={planCount}
          runCount={runCount}
          bugCount={bugCount}
          isLive={isLive}
          onSelect={onSelectTab}
        />
      </div>

      <ErrorBarrier key={tab} region="tab">
        {tab === 'device' ? (
          <DeviceView />
        ) : (
          <div className="workspace__scroll">
            {tab === 'plan' && <Plan />}
            {tab === 'runs' && <Runs />}
            {tab === 'bugs' && <Bugs />}
          </div>
        )}
      </ErrorBarrier>
    </section>
  );
};
