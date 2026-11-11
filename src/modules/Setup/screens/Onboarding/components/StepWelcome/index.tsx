import { useTranslation } from 'react-i18next';
import { useStepWelcomeViewModel } from './hooks';
import './styles.css';

/** O idioma da interface, escolhido numa lista de duas linhas. */
export const StepWelcome: React.FC = () => {
  const { languages } = useStepWelcomeViewModel();
  const { t } = useTranslation();

  return (
    <div className="step-welcome" role="radiogroup" aria-label={t('SETUP.LANGUAGE')}>
      {languages.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={item.isActive}
          className={
            item.isActive
              ? 'step-welcome__language step-welcome__language--on'
              : 'step-welcome__language'
          }
          onClick={item.onSelect}
        >
          <span className="step-welcome__radio" aria-hidden="true" />
          <span className="step-welcome__language-label">{item.label}</span>
          <span className="step-welcome__language-code">{item.code}</span>
        </button>
      ))}
    </div>
  );
};
