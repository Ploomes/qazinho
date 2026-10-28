import type { IJiraStory, JiraFailure } from '@/shared/types';

/**
 * O que o JiraStories precisa do Jira: uma história lida inteira, e um dos arquivos dela
 * baixado.
 */
export interface IJiraRead {
  story: (
    key: string,
  ) => Promise<
    { isRead: true; story: IJiraStory } | { isRead: false; failure: JiraFailure }
  >;
  download: (props: { id: string; file: string; maxBytes: number }) => Promise<boolean>;
}
