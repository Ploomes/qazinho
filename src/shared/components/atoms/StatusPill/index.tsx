import type { IStatusPillProps } from './types';
import { Icon } from '@/shared/components/atoms/Icon';
import { useStatusPillViewModel } from './hooks';
import './styles.css';

export const StatusPill: React.FC<IStatusPillProps> = (props) => {
  const { icon, label, hasLabel, tip, className } = useStatusPillViewModel(props);

  return (
    <span className={className} title={tip} aria-label={tip}>
      <Icon name={icon} />
      {hasLabel && <span className="status-pill__label">{label}</span>}
    </span>
  );
};
