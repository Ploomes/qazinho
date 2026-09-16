/** An agent gocrash found on this machine. gocrash installs nothing: it looks, and reports. */
export interface IDetectedAgent {
  id: string;
  name: string;
  command: string;
  isFound: boolean;
  path: string | null;
}
