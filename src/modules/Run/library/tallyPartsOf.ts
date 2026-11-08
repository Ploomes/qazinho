import type { ParseKeys } from 'i18next';

/** Os casos que falharam, travaram e passaram numa run, cada grupo nas palavras do QA. */
export function tallyPartsOf(props: {
  failed: number;
  blocked?: number;
  passed: number;
  say: (key: ParseKeys, values: { count: number }) => string;
}): string[] {
  const { failed, blocked = 0, passed, say } = props;

  return [
    ...(failed === 0
      ? []
      : [
          say(failed === 1 ? 'CHAT.RUN_FAILED_ONE' : 'CHAT.RUN_FAILED_OTHER', {
            count: failed,
          }),
        ]),
    ...(blocked === 0
      ? []
      : [
          say(blocked === 1 ? 'RUN.TALLY_BLOCKED_ONE' : 'RUN.TALLY_BLOCKED_OTHER', {
            count: blocked,
          }),
        ]),
    ...(passed === 0
      ? []
      : [
          say(passed === 1 ? 'CHAT.RUN_PASSED_ONE' : 'CHAT.RUN_PASSED_OTHER', {
            count: passed,
          }),
        ]),
  ];
}
