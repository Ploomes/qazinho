import type { OrgTemplateFailure } from './OrgTemplateFailure';

/** Uma mudança nos modelos da org feita, ou por que a org recusou. */
export type OrgTemplateDone =
  { isDone: true } | { isDone: false; failure: OrgTemplateFailure };
