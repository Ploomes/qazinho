import type { IPlatformIconProps } from './types';
import { Icon } from '@/shared/components/atoms/Icon';
import { usePlatformIconViewModel } from './hooks';

/** The logo of the platform a target runs on: a globe for the web, Android's, or Apple's. */
export const PlatformIcon: React.FC<IPlatformIconProps> = (props) => {
  const { size, icon } = usePlatformIconViewModel(props);

  return <Icon name={icon} size={size} />;
};
