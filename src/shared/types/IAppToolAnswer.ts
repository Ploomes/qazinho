/**
 * What the page did with one app tool call, in words for the agent, and whether it
 * failed.
 */
export interface IAppToolAnswer {
  id: string;
  text: string;
  isError: boolean;
}
