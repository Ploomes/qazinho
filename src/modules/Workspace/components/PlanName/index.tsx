import type { IPlanNameProps } from './types';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/shared/components/atoms';
import { PLAN_NAME } from './constants';
import { usePlanNameViewModel } from './hooks';
import './styles.css';

/**
 * O nome do plano na barra de título: um clique o transforma num campo no lugar, Enter
 * salva e Esc desiste.
 */
export const PlanName: React.FC<IPlanNameProps> = (props) => {
  const { isEditing, draft, inputRef, onStart, onChange, onCommit, onKeyDown } =
    usePlanNameViewModel(props);
  const { t } = useTranslation();

  return isEditing ? (
    <input
      ref={inputRef}
      className="plan-name plan-name--editing"
      value={draft}
      maxLength={PLAN_NAME.maxLength}
      aria-label={t('WORKSPACE.RENAME')}
      spellCheck={false}
      onChange={onChange}
      onBlur={onCommit}
      onKeyDown={onKeyDown}
    />
  ) : (
    <h1 className="plan-name__heading">
      <button
        type="button"
        className="plan-name"
        title={t('WORKSPACE.RENAME')}
        onClick={onStart}
      >
        <span className="plan-name__text">{props.name}</span>
        <span className="plan-name__pencil">
          <Icon name="edit" size={12} />
        </span>
      </button>
    </h1>
  );
};
