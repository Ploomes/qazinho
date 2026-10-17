import { useTranslation } from 'react-i18next';
import { useStepWelcomeViewModel } from './hooks';
import './styles.css';

export const StepWelcome: React.FC = () => {
  const { languages } = useStepWelcomeViewModel();
  const { t } = useTranslation();

  return (
    <div className="step-welcome">
      <div className="step-welcome__section">
        <span className="step-welcome__eyebrow">{t('SETUP.LANGUAGE')}</span>
        <div className="step-welcome__languages">
          {languages.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                item.isActive
                  ? 'step-welcome__language step-welcome__language--on'
                  : 'step-welcome__language'
              }
              onClick={item.onSelect}
            >
              <span className="step-welcome__language-label">{item.label}</span>
              <span className="step-welcome__language-code">{item.code}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
