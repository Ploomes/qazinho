import type { IAppPort, IToolDone } from '@/modules/Assistant/types';
import type { AppToolCall, IntegrationId } from '@/shared/types';

const NAMES: Record<IntegrationId, string> = { github: 'GitHub', jira: 'Jira' };

function settingsSaid(
  args: Extract<AppToolCall, { name: 'change_settings' }>['args'],
): string {
  return [
    ...(args.theme === undefined
      ? []
      : [`QAzinho is on the ${args.theme === 'night' ? 'Night' : 'Paper'} theme`]),
    ...(args.language === undefined
      ? []
      : [`it speaks ${args.language === 'pt' ? 'Brazilian Portuguese' : 'English'}`]),
    ...(args.runAlert === undefined
      ? []
      : [
          args.runAlert === 'system'
            ? 'a run that ends calls the QA with a notification'
            : 'a run that ends calls the QA only inside QAzinho',
        ]),
  ].join(', ');
}

/** Changes how QAzinho looks and calls the QA, and connects or disconnects a tracker, the disconnecting once the QA confirms. */
export async function performSettingsChange(props: {
  id: string;
  call: Extract<
    AppToolCall,
    { name: 'change_settings' | 'connect_integration' | 'disconnect_integration' }
  >;
  port: IAppPort;
}): Promise<IToolDone> {
  const { id, call, port } = props;

  if (call.name === 'change_settings') {
    const { theme, language, runAlert } = call.args;

    port.changeSettings({
      ...(theme === undefined ? {} : { theme: theme === 'night' ? 'dark' : 'light' }),
      ...(language === undefined ? {} : { language }),
      ...(runAlert === undefined ? {} : { runAlert }),
    });

    return { text: `Done: ${settingsSaid(call.args)}.`, isError: false };
  }

  const integration = call.args.integration;
  const name = NAMES[integration];
  const connected = port.read().integrations.find((status) => status.id === integration);

  if (call.name === 'connect_integration') {
    if (connected !== undefined)
      return {
        text: `${name} is already connected as ${connected.account}.`,
        isError: false,
      };

    port.connectIntegration(integration);

    return {
      text:
        integration === 'github'
          ? "Settings is open on Integrations, and GitHub's connection started there: the QA authorizes it in the browser page QAzinho opens, after QAzinho installs the GitHub CLI if it is missing."
          : "Settings is open on Integrations, with Jira's form open: the QA types the site, the email and the token there. Never ask for the token in this chat.",
      isError: false,
    };
  }

  if (connected === undefined)
    return { text: `${name} is not connected.`, isError: false };

  const decision = await port.confirm({
    id,
    action: 'disconnect_integration',
    subject: name,
    count: 0,
  });

  if (decision === 'kept')
    return { text: `The QA kept ${name} connected.`, isError: false };

  if (decision === 'expired')
    return {
      text: `The QA did not answer in time, so ${name} is still connected.`,
      isError: false,
    };

  await port.disconnectIntegration(integration);

  return {
    text:
      integration === 'github'
        ? "Disconnected GitHub from QAzinho. The GitHub CLI stays signed in for the QA's other tools."
        : 'Disconnected Jira, and its token is gone from this machine.',
    isError: false,
  };
}
