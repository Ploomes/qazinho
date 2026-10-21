import type { IAppPort, IToolDone } from '@/modules/Assistant/types';
import type { SettingsTab } from '@/modules/Settings/types';
import type { AppToolCall } from '@/shared/types';
import { findByRef } from './findByRef';

const SECTION_NAMES: Record<SettingsTab, string> = {
  agents: 'Agents',
  devices: 'Devices',
  integrations: 'Integrations',
  mcps: 'MCPs',
  appearance: 'Appearance',
  shortcuts: 'Shortcuts',
  about: 'About',
};

/** Puts a screen in front of the QA: home, the settings, a project's settings, or a workspace on one of its tabs. */
export function performOpening(props: {
  call: Extract<
    AppToolCall,
    { name: 'open_workspace' | 'open_project' | 'open_settings' | 'go_home' }
  >;
  port: IAppPort;
}): IToolDone {
  const { call, port } = props;
  const state = port.read();

  if (call.name === 'go_home') {
    port.goHome();

    return { text: "QAzinho's home is on screen.", isError: false };
  }

  if (call.name === 'open_settings') {
    const { section } = call.args;

    port.openSettings(section ?? null);

    return {
      text:
        section === undefined
          ? "QAzinho's settings are on screen."
          : `QAzinho's settings are on screen, on ${SECTION_NAMES[section]}.`,
      isError: false,
    };
  }

  if (call.name === 'open_project') {
    const found = findByRef({
      items: state.projects,
      ref: call.args.project,
      noun: 'project',
    });

    if (!found.isFound) return { text: found.text, isError: true };

    port.openProject(found.item.id);

    return {
      text: `The settings of ${found.item.id} "${found.item.name}" are on screen: its name, targets and repositories.`,
      isError: false,
    };
  }

  const found = findByRef({
    items: state.workspaces,
    ref: call.args.workspace,
    noun: 'workspace',
  });

  if (!found.isFound) return { text: found.text, isError: true };

  const workspace = found.item;
  const run =
    call.args.run === undefined
      ? null
      : workspace.runs.find(
          ({ id }) => id.toLowerCase() === call.args.run?.toLowerCase(),
        );
  const bug =
    call.args.bug === undefined
      ? null
      : workspace.bugs.find(
          ({ id }) => id.toLowerCase() === call.args.bug?.toLowerCase(),
        );

  if (run === undefined)
    return {
      text: `${workspace.id} has no run "${call.args.run ?? ''}". Its runs are ${workspace.runs.map(({ id }) => id).join(', ') || 'none yet'}.`,
      isError: true,
    };

  if (bug === undefined)
    return {
      text: `${workspace.id} has no bug "${call.args.bug ?? ''}". Its bugs are ${workspace.bugs.map(({ id }) => id).join(', ') || 'none'}.`,
      isError: true,
    };

  const tab = run !== null ? 'runs' : bug !== null ? 'bugs' : (call.args.tab ?? 'chat');

  port.openWorkspace({
    workspaceId: workspace.id,
    tab,
    runId: run?.id ?? null,
    bugId: bug?.id ?? null,
  });

  return {
    text: `${workspace.id} "${workspace.name}" is on screen, on its ${tab} tab${run === null ? '' : `, with run ${run.id}`}${bug === null ? '' : `, with bug ${bug.id}`}.`,
    isError: false,
  };
}
