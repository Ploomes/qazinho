import type { IRunRowProps } from './types';
import { Icon } from '@/shared/components/atoms';
import './styles.css';

/** One run on a line: its id, what it walked, how it ended, its verdicts, how long and how much, and when. */
export const RunRow: React.FC<IRunRowProps> = ({ row, factsNote }) => (
  <span className="run-row">
    <span className="run-row__id">{row.id}</span>
    <span className="run-row__what">{row.what}</span>
    {row.ended !== null && (
      <span className="run-row__ended">
        <Icon name={row.ended.icon} /> {row.ended.label}
      </span>
    )}
    <span className="run-row__tally run-row__tally--passed">
      <Icon name="passed" /> {row.counts.passed}
    </span>
    <span className="run-row__tally run-row__tally--failed">
      <Icon name="failed" /> {row.counts.failed}
    </span>
    <span className="run-row__tally run-row__tally--blocked">
      <Icon name="blocked" /> {row.counts.blocked}
    </span>
    <span className="run-row__tally run-row__tally--skipped">
      <Icon name="skipped" /> {row.counts.skipped}
    </span>
    <span className="run-row__facts" title={factsNote}>
      {row.facts}
    </span>
    <span className="run-row__when">{row.startedAt}</span>
  </span>
);
