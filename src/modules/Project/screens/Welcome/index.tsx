import { Button, Intern } from '@/shared/components/atoms';
import { useWelcomeViewModel } from './hooks';
import './styles.css';

/** The empty middle of the app: the way to a first project, or to a workspace once a project exists. */
export const Welcome: React.FC = () => {
  const { mood, title, body, action, onAction } = useWelcomeViewModel();

  return (
    <section className="welcome">
      <Intern mood={mood} size={112} />
      <h1 className="welcome__title">{title}</h1>
      <p className="welcome__body">{body}</p>
      <Button variant="primary" onClick={onAction}>
        {action}
      </Button>
    </section>
  );
};
