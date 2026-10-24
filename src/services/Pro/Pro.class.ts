import type {
  IProShare,
  IProSyncBatch,
  ProDownload,
  ProOrgProjects,
  ProSignInProgress,
  ProStatus,
} from '@/shared/types';

/** The only caller of QAzinho Pro's side of the bridge: this machine's sign-in, where it stands, and its projects sent to its org in the background. */
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

  public static async chooseOrg(orgSlug: string): Promise<ProStatus> {
    return (
      (await window.qazinho?.chooseProOrg(orgSlug)) ?? {
        isSignedIn: false,
        canKeepToken: false,
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

  public static async resolve(props: {
    projectId: string;
    workspaceId: string;
    version: number;
  }): Promise<IProShare> {
    return (
      (await window.qazinho?.resolveProConflict(props)) ?? {
        projectId: props.projectId,
        orgSlug: null,
        state: 'off',
        syncedAt: null,
        conflicts: [],
      }
    );
  }

  public static async orgProjects(orgSlug: string): Promise<ProOrgProjects> {
    return (
      (await window.qazinho?.listOrgProjects(orgSlug)) ?? {
        isListed: false,
        failure: 'failed',
      }
    );
  }

  public static async download(props: {
    orgSlug: string;
    projectId: string;
  }): Promise<ProDownload> {
    return (
      (await window.qazinho?.downloadOrgProject(props)) ?? {
        isDownloaded: false,
        failure: 'failed',
      }
    );
  }

  public static async openPage(path: string): Promise<boolean> {
    return (await window.qazinho?.openProPage(path)) ?? false;
  }
}
