import type { ParseKeys } from 'i18next';

/** An issue tracker gocrash can hand a bug to, described in keys so both languages read it. */
export interface IIntegration {
  id: 'github' | 'jira';
  name: string;
  logo: string;
  textKey: ParseKeys;
  needsKey: ParseKeys;
  rows: { labelKey: ParseKeys; valueKey: ParseKeys }[];
}
