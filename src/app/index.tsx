import { AnimatePresence, MotionConfig } from 'motion/react';
import { AssistantDock } from '@/modules/Assistant';
import { ProLinkModal, ProMergeModal, ProRunWarning } from '@/modules/Pro';
import { ProjectModal, VariablesModal, Welcome } from '@/modules/Project';
import { RunNotice, RunReplay } from '@/modules/Run';
import { Settings } from '@/modules/Settings';
import { Onboarding } from '@/modules/Setup';
import { AgentPanel, NewWorkspaceModal, Workspace } from '@/modules/Workspace';
import { Lightbox, Titlebar } from '@/shared/components/organisms';
import { Sidebar } from './components/Sidebar';
import { useAppViewModel } from './hooks';
import './styles.css';

export const App: React.FC = () => {
  const {
    shellStyle,
    isOnboarding,
    hasSidebar,
    isWelcome,
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
        <Titlebar isBare={isOnboarding} />
        <div className="app__body">
          {isOnboarding && <Onboarding />}
          {!isOnboarding && hasSidebar && <Sidebar />}
          {!isOnboarding && isWelcome && <Welcome />}
          {!isOnboarding && !isWelcome && isWorkspace && <Workspace />}
          {!isOnboarding && !isWelcome && isWorkspace && <AgentPanel />}
          {!isOnboarding && !isWelcome && isSettings && <Settings />}
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
      </div>
    </MotionConfig>
  );
};
