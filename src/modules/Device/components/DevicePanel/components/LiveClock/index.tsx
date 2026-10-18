import type { ILiveClockProps } from './types';
import './styles.css';

/** How long the agent has been driving, beside the device and never over its screen. */
export const LiveClock: React.FC<ILiveClockProps> = ({ label }) => (
  <span className="live-clock">
    <span className="live-clock__dot" />
    {label}
  </span>
);
