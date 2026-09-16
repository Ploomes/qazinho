import { MotionConfig } from 'motion/react';
import { Titlebar } from '@/components/organisms';
import { DevicePanel } from '@/modules/Device/components';
import { Welcome } from '@/modules/Project/screens/Welcome';
import { Workspace } from '@/modules/Workspace/screens/Workspace';
import { Sidebar } from './components/Sidebar';
import { useAppViewModel } from './hooks';
import './styles.css';

export const App: React.FC = () => {
  const { hasProjects, isWelcome, isWorkspace } = useAppViewModel();

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <Titlebar />
        <div className="app__body">
          {hasProjects && <Sidebar />}
          {isWelcome && <Welcome />}
          {!isWelcome && isWorkspace && <Workspace />}
          {!isWelcome && isWorkspace && <DevicePanel />}
        </div>
      </div>
    </MotionConfig>
  );
};
