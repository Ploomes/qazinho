import { useEffect } from 'react';
import { useAppStore } from '@/store';

export const useLightboxViewModel = () => {
  const media = useAppStore((state) => state.media);
  const closeMedia = useAppStore((state) => state.closeMedia);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMedia();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeMedia]);

  return {
    media,
    frameWidth: media?.isTall === true ? 320 : 560,
    onClose: closeMedia,
  };
};
