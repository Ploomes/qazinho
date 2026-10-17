import type { IPlatformIconProps } from './types';
import { usePlatformIconViewModel } from './hooks';
import './styles.css';

export const PlatformIcon: React.FC<IPlatformIconProps> = (props) => {
  const { size, glyph } = usePlatformIconViewModel(props);

  return (
    <svg
      className="platform-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {glyph.strokes.map((d) => (
        <path key={d} className="platform-icon__stroke" d={d} />
      ))}
      {glyph.fills.map((d) => (
        <path key={d} className="platform-icon__fill" d={d} />
      ))}
    </svg>
  );
};
