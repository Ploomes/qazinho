import type {
  GithubSignInProgress,
  IBranchList,
  IGithubStatus,
  IRepositoryList,
  IRepositoryRef,
} from '@/shared/types';

/**
 * The only caller of the GitHub side of the bridge: gh's status, its sign-in, and the
 * repositories it reads.
 */
export class Github {
  public static async status(): Promise<IGithubStatus> {
    return (
      (await window.qazinho?.githubStatus()) ?? {
        cli: { isFound: false, path: null },
        account: null,
        missingScopes: [],
        failure: 'no-cli',
      }
    );
  }

  public static async signIn(): Promise<GithubSignInProgress> {
    return (
      (await window.qazinho?.signInGithub()) ?? {
        steps: ['code', 'browser', 'account'],
        phase: 'failed',
        at: 'code',
        failure: 'missing',
        said: '',
      }
    );
  }

  public static async cancelSignIn(): Promise<void> {
    await window.qazinho?.cancelGithubSignIn();
  }

  public static onSignIn(listener: (progress: GithubSignInProgress) => void): () => void {
    return window.qazinho?.onGithubSignIn(listener) ?? (() => undefined);
  }

  public static async repositories(): Promise<IRepositoryList> {
    return (
      (await window.qazinho?.listRepositories()) ?? { isListed: false, failure: 'no-cli' }
    );
  }

  public static async branches(repository: IRepositoryRef): Promise<IBranchList> {
    return (
      (await window.qazinho?.listBranches(repository)) ?? {
        isListed: false,
        failure: 'no-cli',
      }
    );
  }
}
