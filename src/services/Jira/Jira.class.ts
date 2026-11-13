import type {
  IStoryAnswersAsk,
  IStoryDoubtsPost,
  JiraIssueList,
  JiraProjectList,
  JiraStatusList,
  StoryAnswers,
  StoryDoubtsPosted,
  StoryPeople,
  StoryStatus,
} from '@/shared/types';

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

  public static async statuses(): Promise<JiraStatusList> {
    return (
      (await window.qazinho?.listJiraStatuses()) ?? {
        isListed: false,
        failure: 'unreachable',
      }
    );
  }

  public static async status(key: string): Promise<StoryStatus> {
    return (
      (await window.qazinho?.readStoryStatus(key)) ?? {
        isRead: false,
        failure: 'unreachable',
      }
    );
  }

  public static async people(key: string): Promise<StoryPeople> {
    return (
      (await window.qazinho?.readStoryPeople(key)) ?? {
        isRead: false,
        failure: 'unreachable',
      }
    );
  }

  public static async askStory(post: IStoryDoubtsPost): Promise<StoryDoubtsPosted> {
    return (
      (await window.qazinho?.askStory(post)) ?? {
        isPosted: false,
        failure: 'unreachable',
        said: '',
      }
    );
  }

  public static async answers(ask: IStoryAnswersAsk): Promise<StoryAnswers> {
    return (
      (await window.qazinho?.readStoryAnswers(ask)) ?? {
        isRead: false,
        failure: 'unreachable',
      }
    );
  }
}
