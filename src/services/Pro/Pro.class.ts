import type {
  IProShare,
  IProSyncBatch,
  ProSignInProgress,
  ProStatus,
} from '@/shared/types';

/** The only caller of QAzinho Pro's side of the bridge: this machine's sign-in, where it stands, and the projects it shares with an org. */
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

  public static async shares(): Promise<IProShare[]> {
    return (await window.qazinho?.proShares()) ?? [];
  }

  public static async share(props: {
    projectId: string;
    orgSlug: string | null;
  }): Promise<IProShare> {
    return (
      (await window.qazinho?.shareProject(props)) ?? {
        projectId: props.projectId,
        orgSlug: null,
        state: 'off',
        syncedAt: null,
        conflicts: [],
      }
    );
  }

  public static async sync(batch: IProSyncBatch): Promise<IProShare> {
    return (
      (await window.qazinho?.syncPro(batch)) ?? {
        projectId: batch.project.projectId,
        orgSlug: null,
        state: 'off',
        syncedAt: null,
        conflicts: [],
      }
    );
  }

  public static onSync(listener: (share: IProShare) => void): () => void {
    return window.qazinho?.onProSync(listener) ?? (() => undefined);
  }
}
