import type { IKbdProps } from './types';
import { useKbdViewModel } from './hooks';
import './styles.css';

/** Um atalho de teclado, nomeado do jeito que o teclado desta máquina o nomeia. */
export const Kbd: React.FC<IKbdProps> = (props) => {
  const { label } = useKbdViewModel(props);

  return <kbd className="kbd">{label}</kbd>;
};
