import type { ITooltipProps } from './types';
import { useTooltipViewModel } from './hooks';
import './styles.css';

/**
 * Algumas palavras sobre o que o ponteiro ou o foco toca, no painel de dica do app,
 * que desliza entre vizinhos em vez de fechar e abrir.
 */
export const Tooltip: React.FC<ITooltipProps> = (props) => {
  const { anchorRef, className, onPointerEnter, onPointerLeave, onFocus, onBlur } =
    useTooltipViewModel(props);

  return (
    <span
      ref={anchorRef}
      className={className}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {props.children}
    </span>
  );
};
