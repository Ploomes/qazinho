import type { IStatusPillProps } from './types';
import { useStatusPillViewModel } from './hooks';
import './styles.css';

export const StatusPill: React.FC<IStatusPillProps> = (props) => {
  const { glyph, label, className } = useStatusPillViewModel(props);

  return (
    <span className={className}>
      <span aria-hidden="true">{glyph}</span>
      {label}
    </span>
  );
};
