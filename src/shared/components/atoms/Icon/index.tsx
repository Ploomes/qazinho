import type { IIconProps } from './types';
import { useIconViewModel } from './hooks';
import './styles.css';

/**
 * Um dos ícones do Phosphor pelo nome no app: bold por padrão, sólido onde marca o que
 * está ligado ou como algo está, nunca menor do que se lê como ícone.
 */
export const Icon: React.FC<IIconProps> = (props) => {
  const { Glyph, className, size, weight, isHidden, role } = useIconViewModel(props);

  return (
    <Glyph
      className={className}
      size={size}
      weight={weight}
      role={role}
      aria-hidden={isHidden}
      aria-label={props.label}
    />
  );
};
