import type { IGaugeProps } from './types';
import { GAUGE } from './constants';
import { useGaugeViewModel } from './hooks';
import './styles.css';

export const Gauge: React.FC<IGaugeProps> = (props) => {
  const { circumference, offset, className } = useGaugeViewModel(props);

  return (
    <svg
      className="gauge"
      width={GAUGE.size}
      height={GAUGE.size}
      viewBox={`0 0 ${String(GAUGE.size)} ${String(GAUGE.size)}`}
      role="img"
      aria-label={props.label}
    >
      <circle
        className="gauge__track"
        cx={GAUGE.size / 2}
        cy={GAUGE.size / 2}
        r={GAUGE.radius}
        strokeWidth={GAUGE.stroke}
      />
      <circle
        className={className}
        cx={GAUGE.size / 2}
        cy={GAUGE.size / 2}
        r={GAUGE.radius}
        strokeWidth={GAUGE.stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
};
