import type { IScreenshotProps } from '@/components/molecules/Screenshot/types';

export const useScreenshotViewModel = (props: IScreenshotProps) => {
  const { onOpen, isBad = false, size = 'thumb' } = props;

  return {
    className: ['screenshot', `screenshot--${size}`, isBad ? 'screenshot--bad' : '']
      .filter((part) => part.length > 0)
      .join(' '),
    pitch: size === 'thumb' ? 6 : 8,
    onScreenshotClick: onOpen ?? (() => undefined),
  };
};
