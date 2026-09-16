import type { ILogoProps } from '@/components/atoms/Logo/types';
import { useId } from 'react';
import { LOGO } from '@/components/atoms/Logo/constants';

export const useLogoViewModel = (props: ILogoProps) => {
  const { size = LOGO.defaultSize, tone = 'amber' } = props;
  const maskId = `logo-crack-${useId()}`;

  return {
    size,
    className: `logo logo--${tone}`,
    maskId,
    maskUrl: `url(#${maskId})`,
  };
};
