import type { IJudgement } from '@/main/classes/runs/RunCoordinator/types';
import type { Severity, StepVerdict } from '@/types';

const VERDICTS = ['passed', 'failed', 'blocked'];
const SEVERITIES = ['high', 'medium', 'low'];

type Judged = {
  verdict?: unknown;
  why?: unknown;
  got?: unknown;
  title?: unknown;
  severity?: unknown;
};

function read(props: { value: unknown; fallback: string }): string {
  return typeof props.value === 'string' && props.value.length > 0
    ? props.value
    : props.fallback;
}

/** An unreadable judgement is not a pass: a step nobody judged is blocked. */
export function parseVerdict(answer: string): IJudgement {
  let judged: Judged;

  try {
    judged = JSON.parse(answer) as Judged;
  } catch {
    return {
      verdict: 'blocked',
      why: 'The agent did not judge this step.',
      got: '',
      title: '',
      severity: 'medium',
    };
  }

  const verdict = read({ value: judged.verdict, fallback: '' });
  const severity = read({ value: judged.severity, fallback: '' });

  return {
    verdict: (VERDICTS.includes(verdict) ? verdict : 'blocked') as StepVerdict,
    why: read({ value: judged.why, fallback: '' }),
    got: read({ value: judged.got, fallback: '' }),
    title: read({ value: judged.title, fallback: '' }),
    severity: (SEVERITIES.includes(severity) ? severity : 'medium') as Severity,
  };
}
