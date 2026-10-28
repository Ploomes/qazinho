import type { IToolCardProps } from './types';
import { Icon } from '@/shared/components/atoms';
import { useToolCardViewModel } from './hooks';
import './styles.css';

/**
 * Uma ferramenta achada ou faltando nesta máquina; como opção, o próprio cartão é o que o
 * QA escolhe.
 */
export const ToolCard: React.FC<IToolCardProps> = (props) => {
  const { isOption, isSelected, className, onClick, onKeyDown } =
    useToolCardViewModel(props);

  return (
    <div
      className={className}
      role={isOption ? 'radio' : undefined}
      aria-checked={isOption ? isSelected : undefined}
      tabIndex={isOption ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <div className="tool-card__head">
        <span className="tool-card__mark">{isSelected && <Icon name="check" />}</span>
        <span className="tool-card__text">
          <span className="tool-card__name">
            {props.name}
            <span className="tool-card__badge">{props.badge}</span>
          </span>
          <span className="tool-card__about">{props.about}</span>
          <span className="tool-card__detail">{props.detail}</span>
        </span>
        {props.action}
      </div>
      {props.children}
    </div>
  );
};
