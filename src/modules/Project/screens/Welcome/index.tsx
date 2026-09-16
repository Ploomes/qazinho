import { useTranslation } from 'react-i18next';
import { Button, Logo } from '@/components/atoms';
import { useWelcomeViewModel } from './hooks';
import './styles.css';

export const Welcome: React.FC = () => {
  const { onNewProject } = useWelcomeViewModel();
  const { t } = useTranslation();

  return (
    <section className="welcome">
      <span className="welcome__logo">
        <Logo size={56} />
      </span>
      <h1 className="welcome__title">{t('WELCOME.TITLE')}</h1>
      <p className="welcome__body">{t('WELCOME.BODY')}</p>
      <Button variant="primary" onClick={onNewProject}>
        {t('WELCOME.ACTION')}
      </Button>
    </section>
  );
};
