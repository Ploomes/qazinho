import type { IStoryAnswer } from './IStoryAnswer';
import type { JiraFailure } from './JiraFailure';

/** As respostas que a história tem para as dúvidas, ou por que o Jira não disse. */
export type StoryAnswers =
  { isRead: true; answers: IStoryAnswer[] } | { isRead: false; failure: JiraFailure };
