import type { ILogoProps } from './types';
import { LOGO } from './constants';
import { useLogoViewModel } from './hooks';

export const Logo: React.FC<ILogoProps> = (props) => {
  const { size, color, maskId } = useLogoViewModel(props);

  return (
    <svg width={size} height={size} viewBox={LOGO.viewBox} aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <rect width="64" height="64" fill="#fff" />
          <path
            d={LOGO.crackTop}
            stroke="#000"
            strokeWidth={LOGO.crackWidth}
            fill="none"
            strokeLinejoin="round"
          />
          <path
            d={LOGO.crackBottom}
            stroke="#000"
            strokeWidth={LOGO.crackWidth}
            fill="none"
            strokeLinejoin="round"
          />
        </mask>
      </defs>
      <path d={LOGO.triangle} fill={color} mask={`url(#${maskId})`} />
    </svg>
  );
};
