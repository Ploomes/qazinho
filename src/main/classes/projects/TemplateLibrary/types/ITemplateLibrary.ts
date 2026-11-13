export interface ITemplateLibrary {
  file: string;
  now: () => string;
  newId: () => string;
}
