import { AnimatePresence, MotionConfig } from 'motion/react';
import { Lightbox, Titlebar } from '@/components/organisms';
import { DevicePanel } from '@/modules/Device/components';
import { ProjectModal } from '@/modules/Project/components';
import { Welcome } from '@/modules/Project/screens/Welcome';
import { Settings } from '@/modules/Settings/screens/Settings';
import { NewWorkspaceModal } from '@/modules/Workspace/components';
import { Workspace } from '@/modules/Workspace/screens/Workspace';
import { Sidebar } from './components/Sidebar';
import { useAppViewModel } from './hooks';
import './styles.css';

export const App: React.FC = () => {
  const { hasSidebar, isWelcome, isWorkspace, isSettings, modal, hasMedia } =
    useAppViewModel();

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <Titlebar />
        <div className="app__body">
          {hasSidebar && <Sidebar />}
          {isWelcome && <Welcome />}
          {!isWelcome && isWorkspace && <Workspace />}
          {!isWelcome && isWorkspace && <DevicePanel />}
          {!isWelcome && isSettings && <Settings />}
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
