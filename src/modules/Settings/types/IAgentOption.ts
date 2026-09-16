/** An agent gocrash found on this machine. gocrash never installs one. */
export interface IAgentOption {
  name: string;
  isFound: boolean;
  note: string;
  path: string;
}
