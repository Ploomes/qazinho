import type { ILogoProps, LogoVariant } from '@/components/atoms/Logo/types';
import { LOGO } from '@/components/atoms/Logo/constants';

export const useLogoViewModel = (props: ILogoProps) => {
  const { size = LOGO.defaultSize } = props;

  const variant: LogoVariant =
    size >= LOGO.fullFrom ? 'full' : size >= LOGO.midFrom ? 'mid' : 'micro';

  return { size, variant };
};
