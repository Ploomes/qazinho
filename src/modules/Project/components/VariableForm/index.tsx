import type { IVariableFormProps } from './types';
import { useTranslation } from 'react-i18next';
import { Icon, Input } from '@/shared/components/atoms';
import './styles.css';

/**
 * Uma variável como o QA a escreve: o nome em maiúsculas, o que guarda, e o valor,
 * digitado mascarado e nunca mostrado de volta.
 */
export const VariableForm: React.FC<IVariableFormProps> = (props) => {
  const { t } = useTranslation();

  return (
    <div className="variable-form">
      {!props.isValueOnly && (
        <div className="variable-form__row">
          <label className="variable-form__field">
            <span className="variable-form__label">{t('VARIABLES.NAME')}</span>
            <Input
              isMono
              isAutoFocused={props.isNameFocused}
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
      )}

      <label className="variable-form__field">
        <span
          className="variable-form__label"
          title={props.isValueOnly ? props.description : undefined}
        >
          <span className="variable-form__lock">
            <Icon name="lock" size={11} />
          </span>
          {props.isValueOnly ? props.name : t('VARIABLES.VALUE')}
        </span>
        <Input
          isMono
          isSecret
          isAutoFocused={props.isValueFocused}
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
