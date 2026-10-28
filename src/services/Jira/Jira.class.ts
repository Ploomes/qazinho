import type { JiraIssueList, JiraProjectList } from '@/shared/types';

/** O único que chama o lado do Jira da bridge. */
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
