import type { IInternProps } from './types';
import { useInternViewModel } from './hooks';
import './styles.css';

export const Intern: React.FC<IInternProps> = (props) => {
  const { canvasRef, pixels, alt, style } = useInternViewModel(props);

  return (
    <canvas
      ref={canvasRef}
      className="intern"
      width={pixels}
      height={pixels}
      role="img"
      aria-label={alt}
      style={style}
    />
  );
};
