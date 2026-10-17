import type { ILogoProps } from './types';
import { useLogoViewModel } from './hooks';
import './styles.css';

export const Logo: React.FC<ILogoProps> = (props) => {
  const { size, src, className } = useLogoViewModel(props);

  return (
    <img
      className={className}
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
};
