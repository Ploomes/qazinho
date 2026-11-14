import type { GhAnswer } from '@/main/classes/integrations/GithubCli/types';
import type { ConfluenceRead, IJiraStory, JiraFailure } from '@/shared/types';

/** O que a conferência das fontes precisa: o Jira, o Confluence e o gh do próprio QA. */
export interface ISourceCheck {
  readStory: (
    key: string,
  ) => Promise<
    { isRead: true; story: IJiraStory } | { isRead: false; failure: JiraFailure }
  >;
  readComments: (props: {
    key: string;
    since: string;
    skip: string[];
  }) => Promise<{ author: string; at: string; text: string }[] | null>;
  readPage: (pageId: string) => Promise<ConfluenceRead>;
  githubApi: (path: string) => Promise<GhAnswer>;
  storyTextOf: (story: IJiraStory) => string;
}
