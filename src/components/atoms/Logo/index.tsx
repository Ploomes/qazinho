import type { ILogoProps } from './types';
import micro from '@brand/gocrash-mark-micro.svg';
import mid from '@brand/gocrash-mark-mid.svg';
import full from '@brand/gocrash-mark.svg';
import { useLogoViewModel } from './hooks';

const MARKS = { micro, mid, full };

export const Logo: React.FC<ILogoProps> = (props) => {
  const { size, variant } = useLogoViewModel(props);

  return <img src={MARKS[variant]} width={size} height={size} alt="" />;
};
