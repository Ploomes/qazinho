import type { IPlatformIconProps } from '@/components/atoms/PlatformIcon/types';
import { PLATFORM_GLYPHS } from '@/components/atoms/PlatformIcon/constants';

export const usePlatformIconViewModel = (props: IPlatformIconProps) => {
  const { kind, size = 14 } = props;

  return { size, glyph: PLATFORM_GLYPHS[kind] };
};
