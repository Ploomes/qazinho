import type { IReplayPreviewProps } from './types';
import { useReplayPreviewViewModel } from './hooks';

/**
 * Um still do vídeo da run no momento sob o cursor, a partir de uma segunda cópia muda
 * dele.
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
