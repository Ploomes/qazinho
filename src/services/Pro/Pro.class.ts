import type { ProSignInProgress, ProStatus } from '@/shared/types';

/** The only caller of QAzinho Pro's side of the bridge: this machine's sign-in, and where it stands. */
export class Pro {
  public static async status(): Promise<ProStatus> {
    return (
      (await window.qazinho?.proStatus()) ?? { isSignedIn: false, canKeepToken: false }
    );
  }

  public static async signIn(): Promise<ProSignInProgress> {
    return (
      (await window.qazinho?.signInPro()) ?? {
        steps: ['code', 'browser', 'account'],
        phase: 'failed',
        at: 'code',
        failure: 'unexpected',
      }
    );
  }

  public static async cancelSignIn(): Promise<void> {
    await window.qazinho?.cancelProSignIn();
  }

  public static onSignIn(listener: (progress: ProSignInProgress) => void): () => void {
    return window.qazinho?.onProSignIn(listener) ?? (() => undefined);
  }

  public static async signOut(): Promise<ProStatus> {
    return (
      (await window.qazinho?.signOutPro()) ?? { isSignedIn: false, canKeepToken: false }
    );
  }
}
