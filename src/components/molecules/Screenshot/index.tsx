import type { IScreenshotProps } from './types';
import { Stripes } from '@/components/molecules/Stripes';
import { useScreenshotViewModel } from './hooks';
import './styles.css';

export const Screenshot: React.FC<IScreenshotProps> = (props) => {
  const { className, pitch, onScreenshotClick } = useScreenshotViewModel(props);
  const src = props.src ?? null;

  return (
    <button
      type="button"
      className={className}
      aria-label={props.label}
      onClick={onScreenshotClick}
    >
      {src === null ? (
        <Stripes pitch={pitch} />
      ) : (
        <img className="screenshot__shot" src={src} alt="" />
      )}
    </button>
  );
};
