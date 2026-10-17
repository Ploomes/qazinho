import type { ILogoProps } from '@/shared/components/atoms/Logo/types';
import { LOGO } from '@/shared/components/atoms/Logo/constants';

export const useLogoViewModel = (props: ILogoProps) => {
  const { size = LOGO.defaultSize, tone = 'lime' } = props;

  return { size, className: `logo logo--${tone}` };
};
