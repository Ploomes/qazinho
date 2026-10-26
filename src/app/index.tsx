import { AnimatePresence, MotionConfig } from 'motion/react';
import { AssistantDock } from '@/modules/Assistant';
import { Automation } from '@/modules/Automation';
import { ProLinkModal } from '@/modules/Pro';
import { ProjectModal, VariablesModal, Welcome } from '@/modules/Project';
import { RunNotice, RunReplay } from '@/modules/Run';
import { Settings } from '@/modules/Settings';
import { Onboarding } from '@/modules/Setup';
import { NewWorkspaceModal, SidePanel, Workspace } from '@/modules/Workspace';
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
    isAutomation,
    modal,
    variablesKey,
    hasMedia,
    hasRunNotice,
    runNoticeKey,
    hasReplay,
    replayKey,
    hasProLink,
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
          {!isOnboarding && !isWelcome && isWorkspace && <SidePanel />}
          {!isOnboarding && !isWelcome && isSettings && <Settings />}
          {!isOnboarding && !isWelcome && isAutomation && <Automation />}
        </div>

        <AnimatePresence>
          {hasMedia && <Lightbox key="lightbox" />}
          {hasReplay && <RunReplay key={replayKey} />}
          {hasRunNotice && <RunNotice key={runNoticeKey} />}
          {modal === 'project' && <ProjectModal key="project" />}
          {modal === 'workspace' && <NewWorkspaceModal key="workspace" />}
          {variablesKey !== null && <VariablesModal key={variablesKey} />}
          {hasProLink && <ProLinkModal key="pro-link" />}
        </AnimatePresence>

        {!isOnboarding && <AssistantDock />}
      </div>
    </MotionConfig>
  );
};
