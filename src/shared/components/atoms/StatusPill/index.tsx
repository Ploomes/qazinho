import type { IStatusPillProps } from './types';
import { Icon } from '@/shared/components/atoms/Icon';
import { useStatusPillViewModel } from './hooks';
import './styles.css';

export const StatusPill: React.FC<IStatusPillProps> = (props) => {
  const { icon, label, className } = useStatusPillViewModel(props);

  return (
    <span className={className}>
      <Icon name={icon} />
      {label}
    </span>
  );
};
