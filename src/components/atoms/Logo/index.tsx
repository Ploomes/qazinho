import type { ILogoProps } from './types';
import { MARKS } from './constants';
import { useLogoViewModel } from './hooks';

export const Logo: React.FC<ILogoProps> = (props) => {
  const { size, variant } = useLogoViewModel(props);

  return <img src={MARKS[variant]} width={size} height={size} alt="" />;
};
