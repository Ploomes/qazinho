import type { IIconProps } from './types';
import { useIconViewModel } from './hooks';
import './styles.css';

/** One of Phosphor's icons by its name in the app: bold by default, solid where it marks what is on. */
export const Icon: React.FC<IIconProps> = (props) => {
  const { Glyph, size, weight, isHidden, role } = useIconViewModel(props);

  return (
    <Glyph
      className="icon"
      size={size}
      weight={weight}
      role={role}
      aria-hidden={isHidden}
      aria-label={props.label}
    />
  );
};
