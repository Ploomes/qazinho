import type { ILogoProps } from './types';
import { LOGO } from './constants';
import { useLogoViewModel } from './hooks';
import './styles.css';

export const Logo: React.FC<ILogoProps> = (props) => {
  const { size, className, maskId, maskUrl } = useLogoViewModel(props);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={LOGO.viewBox}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect x="0" y="0" width="64" height="64" fill="#fff" />
          <path
            d={LOGO.crack}
            stroke="#000"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={LOGO.branch}
            stroke="#000"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </mask>
      </defs>
      <path className="logo__mark" d={LOGO.triangle} mask={maskUrl} />
    </svg>
  );
};
