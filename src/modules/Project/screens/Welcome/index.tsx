import { Button, IconButton, Intern } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { useWelcomeViewModel } from './hooks';
import './styles.css';

/**
 * O meio vazio do app: o caminho para um primeiro projeto, ou para um workspace depois
 * que um projeto existe.
 */
export const Welcome: React.FC = () => {
  const { mood, title, action, settings, onAction, onSettings } = useWelcomeViewModel();

  return (
    <section className="welcome">
      <div className="welcome__board" data-theme="indigo">
        {settings !== null && (
          <span className="welcome__settings">
            <Tooltip content={settings}>
              <IconButton icon="settings" label={settings} onClick={onSettings} />
            </Tooltip>
          </span>
        )}
        <Intern mood={mood} size={136} />
        <h1 className="welcome__title">{title}</h1>
        <Button variant="primary" onClick={onAction}>
          {action}
        </Button>
      </div>
    </section>
  );
};
