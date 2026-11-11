import { Icon } from '@/shared/components/atoms';
import { useRunProgressViewModel } from './hooks';
import './styles.css';

/** A run no painel: o que ela anda agora, o caso atual passo a passo e os outros. */
export const RunProgress: React.FC = () => {
  const { title, sub, cases } = useRunProgressViewModel();

  return (
    <section className="run-progress" aria-live="polite">
      <header className="run-progress__head">
        <h3 className="run-progress__title">{title}</h3>
        <p className="run-progress__sub">{sub}</p>
      </header>

      {cases.map((testCase) => (
        <div key={testCase.id} className={testCase.className}>
          <div className="run-progress__case-title">
            <span className="run-progress__id">{testCase.id}</span>
            <span className="run-progress__name">{testCase.title}</span>
            {testCase.mark !== null && (
              <span className={testCase.markClassName}>
                <Icon name={testCase.mark} />
              </span>
            )}
          </div>
          {testCase.steps.map((step) => (
            <div key={step.key} className={step.className}>
              <span className="run-progress__step-icon">
                {step.icon !== null && <Icon name={step.icon} />}
              </span>
              {step.action}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
};
