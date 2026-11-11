import { Trans, useTranslation } from 'react-i18next';
import { Bugs } from '@/modules/Bug';
import { DeviceView } from '@/modules/Device';
import { Plan } from '@/modules/Plan';
import { Runs } from '@/modules/Run';
import { Button, StatusPill } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { ErrorBarrier } from '@/shared/components/organisms';
import { MetaLink, PanelTabs, RunButton, TargetChip, WorkspaceName } from './components';
import { useWorkspaceViewModel } from './hooks';
import './styles.css';

export const Workspace: React.FC = () => {
  const {
    hasWorkspace,
    style,
    tab,
    bugCount,
    name,
    metaKey,
    metaCases,
    issue,
    design,
    dropDesignLabel,
    statusLabel,
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
                  <span className="workspace__explore">
                    <Tooltip content={exploreTip}>
                      <Button variant="ghost" onClick={onExplore}>
                        {t('WORKSPACE.EXPLORE')}
                      </Button>
                    </Tooltip>
                  </span>
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
                  canExplore={canExplore}
                  onExplore={onExplore}
                />
              </>
            )}
          </div>
        </div>

        <div className="workspace__meta">
          {isLive ? (
            <StatusPill status={liveStatus} shape="round" label={statusLabel} />
          ) : (
            <>
              <Trans
                i18nKey={metaKey}
                values={{ cases: metaCases }}
                components={{ app: <TargetChip /> }}
              />
              {issue !== null && (
                <Trans
                  i18nKey="WORKSPACE.META_STORY"
                  values={{ key: issue.key }}
                  components={{
                    story: <MetaLink href={issue.url} title={issue.title} />,
                  }}
                />
              )}
              {design !== null && (
                <Trans
                  i18nKey="WORKSPACE.META_DESIGN"
                  values={{ name: design.name }}
                  components={{
                    design: (
                      <MetaLink
                        href={design.url}
                        title={design.title}
                        dropLabel={dropDesignLabel}
                        onDrop={onDropDesign}
                      />
                    ),
                  }}
                />
              )}
            </>
          )}
        </div>
      </header>

      <div className="workspace__tabs">
        <PanelTabs
          current={tab}
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
