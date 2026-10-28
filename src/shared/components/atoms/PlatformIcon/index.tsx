import type { IPlatformIconProps } from './types';
import { Icon } from '@/shared/components/atoms/Icon';
import { usePlatformIconViewModel } from './hooks';

/**
 * O logo da plataforma em que um alvo roda: um globo para a web, o do Android, ou o da
 * Apple.
 */
export const PlatformIcon: React.FC<IPlatformIconProps> = (props) => {
  const { size, icon } = usePlatformIconViewModel(props);

  return <Icon name={icon} size={size} />;
};
