import type { IMeterProps } from './types';
import { useMeterViewModel } from './hooks';
import './styles.css';

export const Meter: React.FC<IMeterProps> = (props) => {
  const { percent } = useMeterViewModel(props);

  return (
    <div className="meter" role="img" aria-label={`${props.label} ${percent}`}>
      <div className="meter__fill" style={{ width: percent }} />
    </div>
  );
};
