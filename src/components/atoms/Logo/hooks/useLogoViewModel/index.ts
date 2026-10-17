import type { ILogoProps } from '@/components/atoms/Logo/types';
import { LOGO } from '@/components/atoms/Logo/constants';
import mark from '@brand/logo/estagiario-mark.png';

export const useLogoViewModel = (props: ILogoProps) => {
  const { size = LOGO.defaultSize, tone = 'lime' } = props;

  return { size, src: mark, className: `logo logo--${tone}` };
};
