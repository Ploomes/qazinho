import type { ITemplate } from './ITemplate';

/** Como foi guardar um modelo: ele como ficou, ou por que não foi guardado. */
export type TemplateSaved =
  | { isSaved: true; template: ITemplate }
  | { isSaved: false; reason: 'unnamed' | 'unwritable' };
