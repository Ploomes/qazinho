import type { GithubSignInProgress, IGithubStatus } from '@/shared/types';

/** The only caller of the GitHub side of the bridge: gh's status and its sign-in, as the QA's own login. */
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
}
