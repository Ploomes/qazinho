import type { SaveOutcome } from '@/shared/types';
import type { IMedia } from '@/store/AppStore/types';
import type { CSSProperties, SyntheticEvent } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive } from '@/services';
import { LIGHTBOX, SAVE_BUTTON } from '@/shared/components/organisms/Lightbox/constants';
import { useShot } from '@/shared/hooks';
import { useAppStore } from '@/store';

export const useLightboxViewModel = () => {
  const media = useAppStore((state) => state.media);
  const closeMedia = useAppStore((state) => state.closeMedia);
  const shot = useShot({ src: media?.src ?? null, file: media?.file ?? null });
  const { t } = useTranslation();
  const [saving, setSaving] = useState<{
    media: IMedia;
    state: SaveOutcome | 'saving';
  } | null>(null);

  const [measured, setMeasured] = useState<{ shot: string; ratio: number } | null>(null);

  const state = saving !== null && saving.media === media ? saving.state : 'idle';
  const ratio =
    measured !== null && measured.shot === shot ? measured.ratio : LIGHTBOX.ratio;

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
    shot,
    frameStyle: {
      '--shot-ratio': String(ratio),
      '--shot-max-width': LIGHTBOX.maxWidth,
      '--shot-max-height': LIGHTBOX.maxHeight,
    } as CSSProperties,
    onShotLoad: (event: SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = event.currentTarget;

      if (shot !== null && naturalWidth > 0 && naturalHeight > 0)
        setMeasured({ shot, ratio: naturalWidth / naturalHeight });
    },
    canSave: shot !== null,
    isSaving: state === 'saving',
    saveGlyph: SAVE_BUTTON[state].glyph,
    saveLabel: t(SAVE_BUTTON[state].labelKey),
    onSave: () => {
      if (media === null || shot === null || state === 'saving') return;

      setSaving({ media, state: 'saving' });
      void Archive.saveShot({
        file: media.file,
        src: media.src,
        name: `${media.kicker} · ${media.title}`,
      }).then((outcome) => {
        setSaving({ media, state: outcome });
      });
    },
    onClose: closeMedia,
  };
};
