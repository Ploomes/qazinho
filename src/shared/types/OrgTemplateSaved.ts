import type { IOrgTemplate } from './IOrgTemplate';
import type { OrgTemplateFailure } from './OrgTemplateFailure';

/** Um modelo publicado ou reescrito na org, ou por que a org recusou. */
export type OrgTemplateSaved =
  | { isSaved: true; template: IOrgTemplate }
  | { isSaved: false; failure: OrgTemplateFailure };
