import type { ILastResult, SuiteTestState } from '@/modules/Automation/types';

/**
 * Como um teste está na tela: rodando agora, como foi na última vez que uma run o
 * alcançou, ou ainda não rodado; um passe numa nova tentativa aparece como flaky.
 */
export function testStateOf(props: {
  isGoing: boolean;
  last: ILastResult | undefined;
}): SuiteTestState {
  const { isGoing, last } = props;

  if (isGoing) return 'running';

  if (last === undefined) return 'pending';

  if (last.result.isFlaky) return 'flaky';

  if (last.result.status === 'passed') return 'passed';

  return last.result.status === 'skipped' ? 'skipped' : 'failed';
}
