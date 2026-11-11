import { Trans } from 'react-i18next';
import { Bugs } from '@/modules/Bug';
import { DeviceView } from '@/modules/Device';
import { Plan } from '@/modules/Plan';
import { Runs } from '@/modules/Run';
import { StatusPill } from '@/shared/components/atoms';
import { ErrorBarrier } from '@/shared/components/organisms';
import { MetaLink, PanelTabs, TargetChip } from './components';
import { useWorkspaceViewModel } from './hooks';
import './styles.css';

export const Workspace: React.FC = () => {
  const {
    hasWorkspace,
    style,
    tab,
    bugCount,
    metaKey,
    metaCases,
    toDevelopLine,
    issue,
    design,
    dropDesignLabel,
    statusLabel,
    liveStatus,
    isLive,
    onSelectTab,
    onDropDesign,
  } = useWorkspaceViewModel();

  if (!hasWorkspace) return null;

  return (
    <section className="workspace" style={style}>
      {!isLive && (
        <>
          <header className="workspace__header">
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
                  {toDevelopLine}
                </>
              )}
            </div>

            <div className="workspace__tabs">
              <PanelTabs
                current={tab}
                bugCount={bugCount}
                isLive={isLive}
                onSelect={onSelectTab}
              />
            </div>
          </header>
        </>
      )}

      <ErrorBarrier key={tab} region="tab">
        {isLive || tab === 'device' ? (
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
