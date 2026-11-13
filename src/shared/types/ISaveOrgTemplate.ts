import type { ISaveTemplate } from './ISaveTemplate';

/** Um modelo para publicar numa org, ou reescrever lá pelo id que a org deu. */
export interface ISaveOrgTemplate {
  orgSlug: string;
  template: ISaveTemplate;
}
