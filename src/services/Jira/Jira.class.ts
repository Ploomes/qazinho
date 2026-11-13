import type {
  BoardColumnList,
  BugComment,
  IStoryAnswersAsk,
  IStoryDoubtsPost,
  ITellStory,
  JiraBoardList,
  JiraIssueList,
  JiraProjectList,
  SprintStories,
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

  public static async boards(query: string): Promise<JiraBoardList> {
    return (
      (await window.qazinho?.listJiraBoards(query)) ?? {
        isListed: false,
        failure: 'unreachable',
      }
    );
  }

  public static async sprint(boardId: number): Promise<SprintStories> {
    return (
      (await window.qazinho?.sprintStories(boardId)) ?? {
        isListed: false,
        failure: 'unreachable',
      }
    );
  }

  public static async columns(boardId: number): Promise<BoardColumnList> {
    return (
      (await window.qazinho?.listBoardColumns(boardId)) ?? {
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

  public static async tell(told: ITellStory): Promise<BugComment> {
    return (
      (await window.qazinho?.tellStory(told)) ?? {
        isPosted: false,
        failure: 'unreachable',
        said: '',
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
