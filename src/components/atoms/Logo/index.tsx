import type { ILogoProps } from './types';
import { Intern } from '@/components/atoms/Intern';
import { useLogoViewModel } from './hooks';
import './styles.css';

export const Logo: React.FC<ILogoProps> = (props) => {
  const { size, className } = useLogoViewModel(props);

  return (
    <span className={className} aria-hidden="true">
      <Intern mood="neutral" size={size} isStill isFigure />
    </span>
  );
};
