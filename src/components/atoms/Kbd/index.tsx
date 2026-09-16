import type { IKbdProps } from './types';
import './styles.css';

export const Kbd: React.FC<IKbdProps> = (props) => (
  <kbd className="kbd">{props.combo}</kbd>
);
