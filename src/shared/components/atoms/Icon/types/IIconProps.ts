import type { IconName } from './IconName';

/**
 * Um ícone pelo nome, da altura do texto em volta a menos que dimensionado, sólido quando
 * marca o que está ligado, e lido em voz alta só com um rótulo.
 */
export interface IIconProps {
  name: IconName;
  size?: number;
  isFilled?: boolean;
  label?: string;
}
