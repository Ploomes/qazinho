import type { OrgDownloadEnd } from '@/modules/Pro/types';
import { projectOfDownload, workspaceOfPlan } from '@/modules/Pro/library';
import { Pro } from '@/services';
import { useAppStore, useVariablesStore, useWorkspaceStore } from '@/store';

export const useOrgDownload = () => {
  const putProject = useAppStore((state) => state.putProject);
  const addWorkspace = useWorkspaceStore((state) => state.addWorkspace);
  const askVariables = useVariablesStore((state) => state.ask);

  return async (offer: {
    orgSlug: string;
    projectId: string;
  }): Promise<OrgDownloadEnd> => {
    const done = await Pro.download(offer);

    if (!done.isDownloaded) return { isDownloaded: false, failure: done.failure };

    const workspaces = done.plans.map((plan) =>
      workspaceOfPlan({ plan, projectId: done.project.projectId }),
    );

    putProject({ ...projectOfDownload(done.project), memories: done.memories });

    for (const workspace of workspaces) addWorkspace(workspace);

    if (done.variables.length > 0)
      askVariables({
        id: `org-${done.project.projectId}`,
        projectId: done.project.projectId,
        drafts: done.variables,
        by: 'org',
      });

    return { isDownloaded: true, workspaceIds: workspaces.map(({ id }) => id) };
  };
};
