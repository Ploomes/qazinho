import type { ITagProps } from './types';
import './styles.css';

/** A assinatura do lockup em mono, baixinha, como "POR PLOOMES". */
export const Tag: React.FC<ITagProps> = (props) => (
  <span className="tag">{props.children}</span>
);
