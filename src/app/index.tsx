import { MotionConfig } from 'motion/react';
import { Titlebar } from '@/components/organisms';
import { Welcome } from '@/modules/Project/screens/Welcome';
import { Sidebar } from './components/Sidebar';
import { useAppViewModel } from './hooks';
import './styles.css';

export const App: React.FC = () => {
  const { hasProjects, isWelcome } = useAppViewModel();

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <Titlebar />
        <div className="app__body">
          {hasProjects && <Sidebar />}
          {isWelcome && <Welcome />}
        </div>
      </div>
    </MotionConfig>
  );
};
