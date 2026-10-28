import type { ILiveClockProps } from './types';
import './styles.css';

/**
 * Há quanto tempo o agente está dirigindo, ao lado do dispositivo e nunca sobre a tela
 * dele.
 */
export const LiveClock: React.FC<ILiveClockProps> = ({ label }) => (
  <span className="live-clock">
    <span className="live-clock__dot" />
    {label}
  </span>
);
