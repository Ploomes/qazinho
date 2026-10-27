/**
 * How the QA answered one of the agent's questions: the options they picked, what they
 * wrote, and the variables an option made them keep.
 */
export interface IQuestionAnswer {
  picked: string[];
  text: string;
  kept?: string[];
}
