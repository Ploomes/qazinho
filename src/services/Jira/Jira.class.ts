import type { JiraIssueList, JiraProjectList } from '@/shared/types';

/** The only caller of the Jira side of the bridge. */
export class Jira {
  public static async search(query: string): Promise<JiraIssueList> {
    return (
      (await window.qazinho?.searchJira(query)) ?? {
        isListed: false,
        failure: 'unreachable',
      }
    );
  }

  public static async projects(): Promise<JiraProjectList> {
    return (
      (await window.qazinho?.listJiraProjects()) ?? {
        isListed: false,
        failure: 'unreachable',
      }
    );
  }
}
