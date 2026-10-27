/**
 * What a tool did, in words for the agent, whether it failed, and the build it started
 * when it started one.
 */
export interface IToolDone {
  text: string;
  isError: boolean;
  buildId?: string;
}
