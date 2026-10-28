import { Button, Intern } from '@/shared/components/atoms';
import { useWelcomeViewModel } from './hooks';
import './styles.css';

/**
 * O meio vazio do app: o caminho para um primeiro projeto, ou para um workspace depois
 * que um projeto existe.
 */
export const Welcome: React.FC = () => {
  const { mood, title, body, action, settings, onAction, onSettings } =
    useWelcomeViewModel();

  return (
    <section className="welcome">
      <div className="welcome__board" data-theme="indigo">
        <Intern mood={mood} size={136} />
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
