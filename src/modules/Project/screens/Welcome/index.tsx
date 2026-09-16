import { Button, Logo } from '@/components/atoms';
import { useWelcomeViewModel } from './hooks';
import './styles.css';

export const Welcome: React.FC = () => {
  const { onNewProject } = useWelcomeViewModel();

  return (
    <section className="welcome">
      <span className="welcome__logo">
        <Logo size={56} />
      </span>
      <h1 className="welcome__title">No projects yet. Nothing to crash.</h1>
      <p className="welcome__body">
        A project is one environment: one URL, or one build. Staging and production are
        separate projects.
      </p>
      <Button variant="primary" onClick={onNewProject}>
        New project
      </Button>
    </section>
  );
};
