import type { IProDownloads, SyncedProject } from './types';
import type { ProDownload, ProOrgProjects } from '@/shared/types';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { PRO_SYNC } from '@/main/classes/pro/ProSync/constants';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { isInside } from '@/main/classes/storage/Archive/library';
import { writeAtomically } from '@/main/library';
import {
  downloadedPlanOf,
  downloadedProjectOf,
  fetchFailureOf,
  hasProject,
  recipeBookOf,
} from './library';

/** Lists the projects an org holds and downloads one to this computer: its plans, with the recordings that walk them without the agent, shared with the org from then on. */
export class ProDownloads {
  private readonly api: IProDownloads['api'];
  private readonly token: () => Promise<string | null>;
  private readonly archiveRoot: string;
  private readonly sync: IProDownloads['sync'];

  public constructor(props: IProDownloads) {
    this.api = props.api;
    this.token = props.token;
    this.archiveRoot = props.archiveRoot;
    this.sync = props.sync;
  }

  /** The projects an org holds, each plan by name and size; a project whose id would not be a name here is left out. */
  public async list(orgSlug: string): Promise<ProOrgProjects> {
    const read = await this.projectsOf(orgSlug);

    if (!read.isRead) return { isListed: false, failure: read.failure };

    return {
      isListed: true,
      projects: read.projects.map((project) => ({
        orgSlug,
        projectId: project.desktopId,
        key: project.key,
        name: project.name,
        plans: project.plans
          .filter(({ desktopId }) => ARCHIVE.workspaceId.test(desktopId))
          .map((plan) => ({
            workspaceId: plan.desktopId,
            name: plan.name,
            cases: plan.cases.length,
          })),
      })),
    };
  }

  /** Downloads a project the org holds and this computer does not: its plans, the recordings of each, and the names of its variables. */
  public async download(props: {
    orgSlug: string;
    projectId: string;
  }): Promise<ProDownload> {
    const { orgSlug, projectId } = props;
    const projectsText = await readFile(
      join(this.archiveRoot, ARCHIVE.projects),
      'utf8',
    ).catch(() => null);

    if (hasProject({ text: projectsText, projectId }))
      return { isDownloaded: false, failure: 'here' };

    const read = await this.projectsOf(orgSlug);

    if (!read.isRead) return { isDownloaded: false, failure: read.failure };

    const project = read.projects.find(({ desktopId }) => desktopId === projectId);

    if (project === undefined) return { isDownloaded: false, failure: 'gone' };

    const plans = project.plans.filter(({ desktopId }) =>
      ARCHIVE.workspaceId.test(desktopId),
    );

    for (const plan of plans)
      await this.keepRecordings({ orgSlug, token: read.token, plan });

    await this.sync.adopt({
      projectId,
      orgSlug,
      plans: plans.map((plan) => ({
        workspaceId: plan.desktopId,
        planId: plan.id,
        version: plan.version,
        cases: plan.cases,
      })),
    });

    return {
      isDownloaded: true,
      orgSlug,
      project: downloadedProjectOf(project),
      plans: plans.map((plan) => downloadedPlanOf({ plan, targets: project.targets })),
      variables: project.variables,
    };
  }

  private async projectsOf(
    orgSlug: string,
  ): Promise<
    | { isRead: true; token: string; projects: SyncedProject[] }
    | { isRead: false; failure: 'signed-out' | 'unreachable' | 'failed' }
  > {
    const token = await this.token();

    if (token === null) return { isRead: false, failure: 'signed-out' };

    const answer = await this.api.syncedProjects({ token, org: orgSlug });

    if (!answer.isOk) return { isRead: false, failure: fetchFailureOf(answer) };

    return {
      isRead: true,
      token,
      projects: answer.value.projects.filter(({ desktopId }) =>
        ARCHIVE.workspaceId.test(desktopId),
      ),
    };
  }

  private async keepRecordings(props: {
    orgSlug: string;
    token: string;
    plan: SyncedProject['plans'][number];
  }): Promise<void> {
    const { orgSlug, token, plan } = props;
    const file = join(
      this.archiveRoot,
      ARCHIVE.workspaces,
      plan.desktopId,
      ARCHIVE.recipes,
    );

    if (
      !isInside({ root: this.archiveRoot, file }) ||
      (await stat(file).catch(() => null)) !== null
    )
      return;

    const answer = await this.api.recordings({
      token,
      org: orgSlug,
      planId: plan.id,
      branch: PRO_SYNC.branch,
    });

    if (!answer.isOk || answer.value.recordings.length === 0) return;

    await mkdir(dirname(file), { recursive: true });
    await writeAtomically({
      file,
      data: JSON.stringify(recipeBookOf(answer.value.recordings), null, 2),
    });
  }
}
