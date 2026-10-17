import { AnimatePresence, MotionConfig } from 'motion/react';
import { Lightbox, Titlebar } from '@/components/organisms';
import { DevicePanel } from '@/modules/Device/components';
import { ProjectModal } from '@/modules/Project/components';
import { Welcome } from '@/modules/Project/screens/Welcome';
import { Settings } from '@/modules/Settings/screens/Settings';
import { Onboarding } from '@/modules/Setup/screens/Onboarding';
import { NewWorkspaceModal } from '@/modules/Workspace/components';
import { Workspace } from '@/modules/Workspace/screens/Workspace';
import { Sidebar } from './components/Sidebar';
import { useAppViewModel } from './hooks';
import './styles.css';

export const App: React.FC = () => {
  const {
    isOnboarding,
    hasSidebar,
    isWelcome,
    isWorkspace,
    isSettings,
    modal,
    hasMedia,
  } = useAppViewModel();

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
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
          {modal === 'project' && <ProjectModal key="project" />}
          {modal === 'workspace' && <NewWorkspaceModal key="workspace" />}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
