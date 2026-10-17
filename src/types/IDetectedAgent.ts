/** An agent QAzinho found on this machine. QAzinho installs nothing: it looks, and reports. */
export interface IDetectedAgent {
  id: string;
  name: string;
  command: string;
  isFound: boolean;
  path: string | null;
  defaultModel: string | null;
}
