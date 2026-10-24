/** Why reading from the org did not work, as the QA reads it: signed out, no answer, or a refusal. */
export function fetchFailureOf(answer: {
  status: number;
}): 'signed-out' | 'unreachable' | 'failed' {
  if (answer.status === 401) return 'signed-out';

  return answer.status === 0 || answer.status >= 500 ? 'unreachable' : 'failed';
}
