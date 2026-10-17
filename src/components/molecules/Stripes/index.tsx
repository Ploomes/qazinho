import type { IStripesProps } from './types';
import type { CSSProperties } from 'react';
import './styles.css';

/** Stands in for a frame QAzinho has not captured yet: a screenshot, a clip, a live stream. */
export const Stripes: React.FC<IStripesProps> = ({ pitch = 8, className = '' }) => (
  <div
    className={`stripes ${className}`.trim()}
    style={{ '--stripe-pitch': pitch } as CSSProperties}
  />
);
