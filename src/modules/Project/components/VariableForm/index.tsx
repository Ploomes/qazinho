import type { IVariableFormProps } from './types';
import { useTranslation } from 'react-i18next';
import { LOCK_ICON } from '@/modules/Project/constants';
import { Input } from '@/shared/components/atoms';
import './styles.css';

/** One variable as the QA writes it: its name in capitals, what it holds, and its value, typed masked and never shown back. */
export const VariableForm: React.FC<IVariableFormProps> = (props) => {
  const { t } = useTranslation();

  return (
    <div className="variable-form">
      <div className="variable-form__row">
        <label className="variable-form__field">
          <span className="variable-form__label">{t('VARIABLES.NAME')}</span>
          <Input
            isMono
            value={props.name}
            label={t('VARIABLES.NAME')}
            placeholder={t('VARIABLES.NAME_PLACEHOLDER')}
            onChange={props.onName}
          />
        </label>
        <label className="variable-form__field">
          <span className="variable-form__label">{t('VARIABLES.DESCRIPTION')}</span>
          <Input
            value={props.description}
            label={t('VARIABLES.DESCRIPTION')}
            placeholder={t('VARIABLES.DESCRIPTION_PLACEHOLDER')}
            onChange={props.onDescription}
          />
        </label>
      </div>

      <label className="variable-form__field">
        <span className="variable-form__label">
          <svg
            className="variable-form__lock"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {LOCK_ICON.map((path) => (
              <path key={path} d={path} />
            ))}
          </svg>
          {t('VARIABLES.VALUE')}
        </span>
        <Input
          isMono
          isSecret
          value={props.value}
          label={t('VARIABLES.VALUE')}
          placeholder={props.valuePlaceholder}
          onChange={props.onValue}
        />
      </label>

      {props.note !== '' && <span className="variable-form__note">{props.note}</span>}
    </div>
  );
};
