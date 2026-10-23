import type { IKbdProps } from './types';
import { useKbdViewModel } from './hooks';
import './styles.css';

/** A keyboard shortcut, named the way this machine's keyboard names it. */
export const Kbd: React.FC<IKbdProps> = (props) => {
  const { label } = useKbdViewModel(props);

  return <kbd className="kbd">{label}</kbd>;
};
