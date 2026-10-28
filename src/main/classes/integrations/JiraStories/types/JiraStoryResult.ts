import type { IJiraStoryCopy, JiraFailure } from '@/shared/types';

/** Uma história do Jira lida com os arquivos dela, ou por que o Jira não a entregou. */
export type JiraStoryResult =
  { isReady: true; copy: IJiraStoryCopy } | { isReady: false; failure: JiraFailure };
