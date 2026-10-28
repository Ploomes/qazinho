import type { ICaretProps } from './types';
import { Icon } from '@/shared/components/atoms/Icon';
import { useCaretViewModel } from './hooks';
import './styles.css';

/** O caret ao lado de algo que dobra: gira para baixo ao abrir, e volta ao fechar. */
export const Caret: React.FC<ICaretProps> = (props) => {
  const { className } = useCaretViewModel(props);

  return (
    <span className={className} aria-hidden="true">
      <Icon name="caretRight" />
    </span>
  );
};
