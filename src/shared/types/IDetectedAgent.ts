/**
 * An agent QAzinho found on this machine, and whether it is signed in; null when the
 * agent would not say.
 */
export interface IDetectedAgent {
  id: string;
  name: string;
  command: string;
  isFound: boolean;
  path: string | null;
  defaultModel: string | null;
  isSignedIn: boolean | null;
}
