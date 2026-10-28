import type { IRunRowProps } from './types';
import { Icon } from '@/shared/components/atoms';
import './styles.css';

/**
 * Uma run numa linha: o id, o que andou, como terminou, os vereditos, quanto tempo e
 * quanto custou, e quando.
 */
export const RunRow: React.FC<IRunRowProps> = ({ row, factsNote }) => (
  <span className="run-row">
    <span className="run-row__id">{row.id}</span>
    <span className="run-row__what">{row.what}</span>
    {row.ended !== null && (
      <span className="run-row__ended">
        <Icon name={row.ended.icon} /> {row.ended.label}
      </span>
    )}
    {row.tallies.map((tally) => (
      <span
        key={tally.status}
        className={`run-row__tally run-row__tally--${tally.status}`}
      >
        <Icon name={tally.icon} /> {tally.count}
      </span>
    ))}
    <span className="run-row__facts" title={factsNote}>
      {row.facts}
    </span>
    <span className="run-row__when">{row.startedAt}</span>
  </span>
);
