import type { IReplayPreviewProps } from '@/modules/Run/components/RunReplay/components/ReplayTimeline/components/ReplayPreview/types';
import { useEffect, useEffectEvent, useRef } from 'react';

export const useReplayPreviewViewModel = (props: IReplayPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSeeking = useRef(false);
  const wanted = useRef<number | null>(null);

  const seek = (ms: number) => {
    const video = videoRef.current;

    if (
      !video ||
      video.readyState < HTMLMediaElement.HAVE_METADATA ||
      isSeeking.current
    ) {
      wanted.current = ms;

      return;
    }

    isSeeking.current = true;
    video.currentTime = ms / 1000;
  };

  const onWanted = useEffectEvent((ms: number) => {
    seek(ms);
  });

  useEffect(() => {
    if (props.ms !== null) onWanted(props.ms);
  }, [props.ms]);

  const catchUp = () => {
    isSeeking.current = false;

    const next = wanted.current;

    wanted.current = null;

    if (next !== null) seek(next);
  };

  return {
    hasVideo: props.url !== null,
    src: props.url ?? undefined,
    videoRef,
    onSeeked: catchUp,
    onLoadedMetadata: catchUp,
  };
};
