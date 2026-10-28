import type { IStripesProps } from './types';
import type { CSSProperties } from 'react';
import './styles.css';

/**
 * Ocupa o lugar de um frame que o QAzinho ainda não capturou: um screenshot, um clipe, um
 * stream vivo.
 */
export const Stripes: React.FC<IStripesProps> = ({ pitch = 8, className = '' }) => (
  <div
    className={`stripes ${className}`.trim()}
    style={{ '--stripe-pitch': pitch } as CSSProperties}
  />
);
