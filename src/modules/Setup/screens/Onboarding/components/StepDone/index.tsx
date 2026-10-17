import { useTranslation } from 'react-i18next';
import { Intern } from '@/components/atoms';
import { useStepDoneViewModel } from './hooks';
import './styles.css';

export const StepDone: React.FC = () => {
  const { rows } = useStepDoneViewModel();
  const { t } = useTranslation();

  return (
    <div className="step-done">
      <Intern mood="passed" size={88} />
      {rows.map((row) => (
        <div
          key={row.id}
          className={
            row.isReady ? 'step-done__row step-done__row--ready' : 'step-done__row'
          }
        >
          <span className="step-done__glyph" aria-hidden="true">
            {row.isReady ? '✓' : '–'}
          </span>
          <span className="step-done__label">{row.label}</span>
          <span className="step-done__value">{row.value}</span>
        </div>
      ))}
      <p className="step-done__note">{t('SETUP.DONE_NOTE')}</p>
    </div>
  );
};
