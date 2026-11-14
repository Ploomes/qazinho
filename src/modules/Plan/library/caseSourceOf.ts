import type { CaseSourceKey } from '@/modules/Plan/types';

const WORDS: Partial<Record<string, CaseSourceKey>> = {
  page: 'PLAN.CASE_SOURCE_PAGE',
  code: 'PLAN.CASE_SOURCE_CODE',
  app: 'PLAN.CASE_SOURCE_APP',
  qa: 'PLAN.CASE_SOURCE_QA',
};

/** O texto de uma fonte do esperado (C2, frame 12:345, app), ou nada se é outra. */
export function caseSourceOf(
  source: string,
): { key: CaseSourceKey; number: string; id: string } | null {
  const said = source.trim();
  const criterion = /^C(\d+)$/i.exec(said);
  const frame = /^frame\s+(\S+)$/i.exec(said);

  if (criterion?.[1] !== undefined)
    return { key: 'PLAN.CASE_SOURCE_CRITERION', number: criterion[1], id: '' };

  if (frame?.[1] !== undefined)
    return { key: 'PLAN.CASE_SOURCE_FRAME', number: '', id: frame[1] };

  const key = WORDS[said.toLowerCase()];

  return key === undefined ? null : { key, number: '', id: '' };
}
