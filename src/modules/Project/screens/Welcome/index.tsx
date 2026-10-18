import { Button, Intern } from '@/shared/components/atoms';
import { useWelcomeViewModel } from './hooks';
import './styles.css';

/** The empty middle of the app: the way to a first project, or to a workspace once a project exists. */
export const Welcome: React.FC = () => {
  const { mood, title, body, action, settings, onAction, onSettings } =
    useWelcomeViewModel();

  return (
    <section className="welcome">
      <div className="welcome__board" data-theme="indigo">
        <Intern mood={mood} size={136} isOnIndigo />
        <h1 className="welcome__title">{title}</h1>
        <p className="welcome__body">{body}</p>
        <Button variant="primary" onClick={onAction}>
          {action}
        </Button>
        {settings !== null && (
          <Button variant="ghost" size="sm" onClick={onSettings}>
            {settings}
          </Button>
        )}
      </div>
    </section>
  );
};
