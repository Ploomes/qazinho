import type { IMomentTileProps } from './types';
import { Icon } from '@/shared/components/atoms';
import { useMomentTileViewModel } from './hooks';
import './styles.css';

/**
 * O vídeo da run parado no momento em que um bug foi pego, ao lado dos screenshots; um
 * clique toca essa gravação.
 */
export const MomentTile: React.FC<IMomentTileProps> = (props) => {
  const { label, hasVideo, src, videoRef, onLoadedMetadata, onOpen } =
    useMomentTileViewModel(props);

  return (
    <button type="button" className="moment-tile" aria-label={label} onClick={onOpen}>
      <span className="moment-tile__screen">
        {hasVideo && (
          <video
            ref={videoRef}
            className="moment-tile__frame"
            src={src}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={onLoadedMetadata}
          />
        )}
        <span className="moment-tile__play">
          <Icon name="play" />
        </span>
      </span>
      <span className="moment-tile__label">{label}</span>
    </button>
  );
};
