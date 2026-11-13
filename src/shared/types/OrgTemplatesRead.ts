import type { IOrgTemplates } from './IOrgTemplates';
import type { OrgTemplateFailure } from './OrgTemplateFailure';

/** Os modelos de uma org, ou por que não foram lidos nem estavam guardados aqui. */
export type OrgTemplatesRead =
  | { isListed: true; list: IOrgTemplates }
  | { isListed: false; failure: OrgTemplateFailure };
