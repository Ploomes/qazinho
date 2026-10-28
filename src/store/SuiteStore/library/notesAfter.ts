import type { SuiteChangeNote } from '@/modules/Automation/types';
import type { SuiteChangeEvent } from '@/shared/types';

const KEPT = 40;

/**
 * O que o agente fez enquanto muda uma suíte, o mais novo por último, quando diz uma
 * linha ou roda testes; uma linha em branco não soma, e só as últimas ficam.
 */
export function notesAfter(props: {
  notes: SuiteChangeNote[];
  event: Exclude<SuiteChangeEvent, { kind: 'changed' }>;
}): SuiteChangeNote[] {
  const { notes, event } = props;
  const id = (notes.at(-1)?.id ?? 0) + 1;

  if (event.kind === 'ran')
    return [
      ...notes,
      { id, kind: 'ran' as const, total: event.total, passed: event.passed },
    ].slice(-KEPT);

  const text = event.text.trim();

  return text === ''
    ? notes
    : [...notes, { id, kind: 'said' as const, text }].slice(-KEPT);
}
