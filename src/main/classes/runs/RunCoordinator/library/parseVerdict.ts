import type { StepVerdict } from '@/types';

const VERDICTS = ['passed', 'failed', 'blocked'];

type Judged = { verdict?: unknown; why?: unknown; got?: unknown };

/** An unreadable judgement is not a pass: a step nobody judged is blocked. */
export function parseVerdict(answer: string): {
  verdict: StepVerdict;
  why: string;
  got: string;
} {
  let judged: Judged;

  try {
    judged = JSON.parse(answer) as Judged;
  } catch {
    return { verdict: 'blocked', why: 'The agent did not judge this step.', got: '' };
  }

  const verdict = typeof judged.verdict === 'string' ? judged.verdict : '';

  return {
    verdict: (VERDICTS.includes(verdict) ? verdict : 'blocked') as StepVerdict,
    why: typeof judged.why === 'string' ? judged.why : '',
    got: typeof judged.got === 'string' ? judged.got : '',
  };
}
