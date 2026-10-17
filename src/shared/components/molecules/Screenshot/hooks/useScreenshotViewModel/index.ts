import type { IScreenshotProps } from '@/shared/components/molecules/Screenshot/types';
import { useShot } from '@/shared/hooks';

export const useScreenshotViewModel = (props: IScreenshotProps) => {
  const { onOpen, isBad = false, size = 'thumb' } = props;
  const shot = useShot({ src: props.src ?? null, file: props.file ?? null });

  return {
    shot,
    className: ['screenshot', `screenshot--${size}`, isBad ? 'screenshot--bad' : '']
      .filter((part) => part.length > 0)
      .join(' '),
    pitch: size === 'thumb' ? 6 : 8,
    onScreenshotClick: onOpen ?? (() => undefined),
  };
};
