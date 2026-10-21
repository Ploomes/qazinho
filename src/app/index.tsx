import { AnimatePresence, MotionConfig } from 'motion/react';
import { DevicePanel } from '@/modules/Device';
import { ProjectModal, Welcome } from '@/modules/Project';
import { RunNotice, RunReplay } from '@/modules/Run';
import { Settings } from '@/modules/Settings';
import { Onboarding } from '@/modules/Setup';
import { NewWorkspaceModal, Workspace } from '@/modules/Workspace';
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
    hasMedia,
    hasRunNotice,
    runNoticeKey,
    hasReplay,
    replayKey,
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
          {!isOnboarding && !isWelcome && isWorkspace && <DevicePanel />}
          {!isOnboarding && !isWelcome && isSettings && <Settings />}
        </div>

        <AnimatePresence>
          {hasMedia && <Lightbox key="lightbox" />}
          {hasReplay && <RunReplay key={replayKey} />}
          {hasRunNotice && <RunNotice key={runNoticeKey} />}
          {modal === 'project' && <ProjectModal key="project" />}
          {modal === 'workspace' && <NewWorkspaceModal key="workspace" />}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
