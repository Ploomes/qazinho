/**
 * One thing a command names, as its chip shows it: a repository, a branch, a story's key
 * or its title; the one that matters most stands out.
 */
export interface ICommandPart {
  key: string;
  text: string;
  isStrong: boolean;
}
