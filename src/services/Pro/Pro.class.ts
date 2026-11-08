import type {
  IProLink,
  IProPublishBrief,
  IProShare,
  IProSyncBatch,
  ProDownload,
  ProOrgProjects,
  ProRemoval,
  ProSignInProgress,
  ProStatus,
} from '@/shared/types';

/**
 * O único que chama o lado do QAzinho Pro da bridge: o login desta máquina, em que pé
 * está, e cada projeto que ela liga a uma org.
 */
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

  public static async sync(batch: IProSyncBatch): Promise<IProShare> {
    return (
      (await window.qazinho?.syncPro(batch)) ?? {
        projectId: batch.project.projectId,
        orgSlug: null,
        state: 'off',
        syncedAt: null,
        pending: [],
        conflicts: [],
      }
    );
  }

  public static async publish(props: {
    batch: IProSyncBatch;
    orgSlug: string;
    hasHistoryMedia: boolean;
  }): Promise<IProShare> {
    return (
      (await window.qazinho?.publishPro(props)) ??
      Pro.offOf(props.batch.project.projectId)
    );
  }

  public static async sendPlans(batch: IProSyncBatch): Promise<IProShare> {
    return (
      (await window.qazinho?.sendProPlans(batch)) ?? Pro.offOf(batch.project.projectId)
    );
  }

  public static async unlink(projectId: string): Promise<IProShare> {
    return (await window.qazinho?.unlinkPro(projectId)) ?? Pro.offOf(projectId);
  }

  public static async remove(projectId: string): Promise<ProRemoval> {
    return (
      (await window.qazinho?.removeProProject(projectId)) ?? {
        isRemoved: false,
        failure: 'failed',
      }
    );
  }

  public static async brief(batch: IProSyncBatch): Promise<IProPublishBrief> {
    return (
      (await window.qazinho?.briefPro(batch)) ?? {
        plans: batch.plans.length,
        runs: batch.runs.length,
        bugs: batch.bugs.length,
        memories: 0,
        mediaBytes: 0,
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
        pending: [],
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

  public static onLink(listener: () => void): () => void {
    return window.qazinho?.onProLink(listener) ?? (() => undefined);
  }

  public static async takeLink(): Promise<IProLink | null> {
    return (await window.qazinho?.takeProLink()) ?? null;
  }

  public static async openPage(path: string): Promise<boolean> {
    return (await window.qazinho?.openProPage(path)) ?? false;
  }

  private static offOf(projectId: string): IProShare {
    return {
      projectId,
      orgSlug: null,
      state: 'off',
      syncedAt: null,
      pending: [],
      conflicts: [],
    };
  }
}
