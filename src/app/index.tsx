import { AnimatePresence, MotionConfig } from 'motion/react';
import { AssistantDock } from '@/modules/Assistant';
import { ProLinkModal, ProMergeModal, ProRunWarning } from '@/modules/Pro';
import { ProjectModal, VariablesModal, Welcome } from '@/modules/Project';
import { RunNotice, RunReplay } from '@/modules/Run';
import { Settings } from '@/modules/Settings';
import { Onboarding } from '@/modules/Setup';
import { UpdateRequired } from '@/modules/Update';
import { AgentPanel, NewWorkspaceModal, Workspace } from '@/modules/Workspace';
import { ErrorBarrier, Lightbox, Titlebar } from '@/shared/components/organisms';
import { Sidebar } from './components/Sidebar';
import { useAppViewModel } from './hooks';
import './styles.css';

export const App: React.FC = () => {
  const {
    shellStyle,
    isUpdateBlocked,
    isTitlebarBare,
    isOnboarding,
    hasSidebar,
    isWelcome,
    isChatOnly,
    isWorkspace,
    isSettings,
    modal,
    projectModalKey,
    variablesKey,
    hasMedia,
    hasRunNotice,
    runNoticeKey,
    hasReplay,
    replayKey,
    hasProLink,
    hasProMerge,
    hasHeldRun,
  } = useAppViewModel();

  return (
    <MotionConfig reducedMotion="user">
      <div className="app" style={shellStyle}>
        <Titlebar isBare={isTitlebarBare} />
        {isUpdateBlocked ? (
          <div className="app__body">
            <UpdateRequired />
          </div>
        ) : (
          <>
            <div className="app__body">
              <ErrorBarrier region="screen">
                {isOnboarding && <Onboarding />}
                {!isOnboarding && hasSidebar && (
                  <ErrorBarrier region="sidebar">
                    <Sidebar />
                  </ErrorBarrier>
                )}
                {!isOnboarding && isWelcome && <Welcome />}
                {!isOnboarding && !isWelcome && isWorkspace && !isChatOnly && (
                  <Workspace />
                )}
                {!isOnboarding && !isWelcome && isWorkspace && <AgentPanel />}
                {!isOnboarding && !isWelcome && isSettings && <Settings />}
              </ErrorBarrier>
            </div>

            <AnimatePresence>
              {hasMedia && <Lightbox key="lightbox" />}
              {hasReplay && <RunReplay key={replayKey} />}
              {hasRunNotice && <RunNotice key={runNoticeKey} />}
              {modal === 'project' && <ProjectModal key={projectModalKey} />}
              {modal === 'workspace' && <NewWorkspaceModal key="workspace" />}
              {variablesKey !== null && <VariablesModal key={variablesKey} />}
              {hasProLink && <ProLinkModal key="pro-link" />}
              {hasProMerge && <ProMergeModal key="pro-merge" />}
              {hasHeldRun && <ProRunWarning key="pro-run-warning" />}
            </AnimatePresence>

            {!isOnboarding && <AssistantDock />}
          </>
        )}
      </div>
    </MotionConfig>
  );
};
