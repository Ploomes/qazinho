import type { IIconProps } from '@/shared/components/atoms/Icon/types';
import { ICONS } from '@/shared/components/atoms/Icon/constants';

export const useIconViewModel = (props: IIconProps) => {
  const { glyph, weight } = ICONS[props.name];

  return {
    Glyph: glyph,
    size: props.size ?? '1em',
    weight: props.isFilled === true ? 'fill' : weight,
    isHidden: props.label === undefined,
    role: props.label === undefined ? undefined : 'img',
  };
};
