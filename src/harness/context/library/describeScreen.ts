import type { IHarnessSection } from '@/harness/context/types';
import type { IAppSnapshot } from '@/shared/types';

/** Where the QA is in QAzinho as they write: home, settings, or a workspace on one of its tabs, with what is open there. */
export function describeScreen(app: IAppSnapshot): IHarnessSection {
  const title = 'On screen';
  const workspace = app.workspaces.find(({ id }) => id === app.openWorkspaceId);

  if (app.screen === 'settings')
    return { title, lines: ["The QA is in QAzinho's settings."] };

  if (app.screen !== 'workspace' || workspace === undefined)
    return { title, lines: ["The QA is on QAzinho's home."] };

  const open =
    app.openTab === 'runs' && app.openRunId !== null
      ? `, with run ${app.openRunId} open`
      : app.openTab === 'bugs' && app.openBugId !== null
        ? `, with bug ${app.openBugId} open`
        : '';

  return {
    title,
    lines: [
      `The QA is on the workspace "${workspace.name}" (${workspace.id}), on its ${app.openTab ?? 'chat'} tab${open}.`,
    ],
  };
}
