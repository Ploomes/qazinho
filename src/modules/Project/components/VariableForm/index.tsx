import type { IVariableFormProps } from './types';
import { useTranslation } from 'react-i18next';
import { Icon, IconButton, Input, Switch } from '@/shared/components/atoms';
import { useVariableFormViewModel } from './hooks';
import './styles.css';

/**
 * Uma variável como o QA a escreve: o nome em maiúsculas, o que guarda, o valor, e se é
 * um segredo, escondido e nunca mostrado de volta.
 */
export const VariableForm: React.FC<IVariableFormProps> = (props) => {
  const { isShown, eyeIcon, eyeLabel, secretLabel, secretTip, onEye, onSecretSwitch } =
    useVariableFormViewModel(props);
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

      <div className="variable-form__field">
        <div className="variable-form__value-head">
          <span
            className="variable-form__label"
            title={props.isValueOnly ? props.description : undefined}
          >
            {props.isSecret && (
              <span className="variable-form__lock">
                <Icon name="lock" size={11} />
              </span>
            )}
            {props.isValueOnly ? props.name : t('VARIABLES.VALUE')}
          </span>
          <Switch
            label={secretLabel}
            title={secretTip}
            isOn={props.isSecret}
            onChange={onSecretSwitch}
          />
        </div>
        <div className="variable-form__value">
          <Input
            isMono
            isSecret={!isShown}
            isAutoFocused={props.isValueFocused}
            value={props.value}
            label={props.isValueOnly ? props.name : t('VARIABLES.VALUE')}
            placeholder={props.valuePlaceholder}
            onChange={props.onValue}
          />
          <IconButton icon={eyeIcon} size="sm" label={eyeLabel} onClick={onEye} />
        </div>
      </div>

      {props.note !== '' && <span className="variable-form__note">{props.note}</span>}
    </div>
  );
};
