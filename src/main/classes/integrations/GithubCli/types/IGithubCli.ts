import type { GithubSignInProgress } from '@/shared/types';

export interface IGithubCli {
  directories: () => Promise<string[]>;
  onProgress: (progress: GithubSignInProgress) => void;
}
