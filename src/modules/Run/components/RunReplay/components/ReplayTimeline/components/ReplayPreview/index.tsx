import type { IReplayPreviewProps } from './types';
import { useReplayPreviewViewModel } from './hooks';

/**
 * A still of the run's video at the moment under the cursor, from a second, silent copy
 * of it.
 */
export const ReplayPreview: React.FC<IReplayPreviewProps> = (props) => {
  const { hasVideo, src, videoRef, onSeeked, onLoadedMetadata } =
    useReplayPreviewViewModel(props);

  return (
    hasVideo && (
      <video
        ref={videoRef}
        className="replay-timeline__frame"
        src={src}
        muted
        playsInline
        preload="auto"
        onSeeked={onSeeked}
        onLoadedMetadata={onLoadedMetadata}
      />
    )
  );
};
