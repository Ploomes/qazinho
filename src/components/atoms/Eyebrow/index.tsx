import type { IEyebrowProps } from './types';
import './styles.css';

export const Eyebrow: React.FC<IEyebrowProps> = (props) => (
  <span className="eyebrow">{props.children}</span>
);
