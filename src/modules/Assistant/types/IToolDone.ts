/** What a tool did, in words for the agent, and whether it failed. */
export interface IToolDone {
  text: string;
  isError: boolean;
}
