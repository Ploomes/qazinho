import type { IDetectedAgent, IDeviceTools } from '@/shared/types';

/**
 * O que um QA cola quando algo deu errado: versão, máquina, ferramentas achadas e as
 * últimas linhas do log.
 */
export function diagnosticsOf(props: {
  version: string;
  system: string;
  versions: { electron: string; chrome: string; node: string };
  locale: string;
  agents: IDetectedAgent[];
  devices: IDeviceTools;
  log: string[];
}): string {
  return [
    `QAzinho ${props.version}`,
    `System: ${props.system}`,
    `Electron ${props.versions.electron} · Chrome ${props.versions.chrome} · Node ${props.versions.node}`,
    `Locale: ${props.locale}`,
    'Agents:',
    ...props.agents.map(
      (agent) =>
        `- ${agent.name}: found ${said(agent.isFound)}, signed in ${said(agent.isSignedIn)}`,
    ),
    'Devices:',
    `- Android SDK: ${said(props.devices.androidSdk.isFound)}`,
    `- Xcode: ${said(props.devices.xcode.isFound)}`,
    `- AXe: ${said(props.devices.axe.isFound)}`,
    '',
    `Last ${String(props.log.length)} lines of the log:`,
    ...props.log,
  ].join('\n');
}

const said = (isOn: boolean | null) => (isOn === null ? 'unknown' : isOn ? 'yes' : 'no');
