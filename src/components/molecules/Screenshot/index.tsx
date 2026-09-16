import type { IScreenshotProps } from './types';
import { Stripes } from '@/components/molecules/Stripes';
import { useScreenshotViewModel } from './hooks';
import './styles.css';

export const Screenshot: React.FC<IScreenshotProps> = (props) => {
  const { shot, className, pitch, onScreenshotClick } = useScreenshotViewModel(props);

  return (
    <button
      type="button"
      className={className}
      aria-label={props.label}
      onClick={onScreenshotClick}
    >
      {shot === null ? (
        <Stripes pitch={pitch} />
      ) : (
        <img className="screenshot__shot" src={shot} alt="" />
      )}
    </button>
  );
};
