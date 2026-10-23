import type { IIntegrationCardProps } from '@/modules/Setup/components/IntegrationCard/types';
import type { IIntegrationField } from '@/modules/Setup/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CONFLUENCE_FAILURE_KEYS } from '@/modules/Setup/constants';
import { useGithubConnect } from '@/modules/Setup/hooks/useGithubConnect';
import { connectFailureOf, connectionOf, formatDay } from '@/modules/Setup/library';
import { Confluence, Integrations, Platform } from '@/services';
import { useSettingsStore, useSetupStore } from '@/store';

export const useIntegrationCardViewModel = (props: IIntegrationCardProps) => {
  const { integration } = props;
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Partial<Record<IIntegrationField['id'], string>>>(
    {},
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);
  const [confluenceError, setConfluenceError] = useState('');
  const language = useSettingsStore((state) => state.language);
  const status = useSetupStore((state) =>
    state.integrations.find(({ id }) => id === integration.id),
  );
  const landIntegration = useSetupStore((state) => state.landIntegration);
  const dropIntegration = useSetupStore((state) => state.dropIntegration);
  const connectingId = useSetupStore((state) => state.connectingId);
  const clearConnect = useSetupStore((state) => state.clearConnect);
  const isCli = integration.via === 'cli';
  const cli = useGithubConnect({ isOn: isCli });

  const connection = connectionOf({ id: integration.id, values });
  const isConnected = status !== undefined;
  const isCliMissing = isCli && cli.status?.cli.isFound === false;
  const isInstalling = cli.install?.phase === 'installing';
  const isCliBusy = isInstalling || cli.signIn?.phase === 'working';
  const isCliKnown = cli.status !== null;
  const isAsked = connectingId === integration.id;
  const { onConnect: startSignIn, onInstall: installCli } = cli;

  useEffect(() => {
    if (!isAsked) return;

    if (isConnected) {
      clearConnect();

      return;
    }

    if (!isCli || !isCliKnown || isCliBusy) return;

    clearConnect();

    if (isCliMissing) void installCli();
    else startSignIn();
  }, [
    isAsked,
    isConnected,
    isCli,
    isCliKnown,
    isCliBusy,
    isCliMissing,
    clearConnect,
    installCli,
    startSignIn,
  ]);

  return {
    isConnected,
    isOpen: (isOpen || isAsked) && !isConnected && !isCli,
    hasAction: isConnected || isCli || !isOpen,
    isActionBusy: !isConnected && isCliBusy,
    isConnecting,
    error: isCli ? cli.error : error,
    text: t(integration.textKey),
    needs: t(integration.needsKey),
    cliLine: !isCli
      ? null
      : cli.status === null
        ? null
        : isCliMissing
          ? t('SETUP.GITHUB_CLI_MISSING', {
              installer: Platform.isWindows() ? 'winget' : 'Homebrew',
            })
          : cli.status.account === null
            ? t('SETUP.GITHUB_CLI_SIGNED_OUT')
            : t('SETUP.GITHUB_CLI_AS', { account: cli.status.account }),
    pill: isConnected ? ('passed' as const) : ('idle' as const),
    statusLabel: isConnected ? t('SETUP.CONNECTED') : t('SETUP.NOT_CONNECTED'),
    action: isConnected
      ? t('COMMON.DISCONNECT')
      : isInstalling
        ? t('SETUP.GITHUB_INSTALLING')
        : isCliMissing
          ? t('SETUP.GITHUB_INSTALL')
          : t('COMMON.CONNECT'),
    connectLabel: isConnecting ? t('SETUP.CHECKING_TOKEN') : t('COMMON.CONNECT'),
    canConnect: connection !== null && !isConnecting,
    tokenUrl: integration.tokenUrl ?? '',
    connectedNote: isCli
      ? t('SETUP.GITHUB_CONNECTED_NOTE')
      : t('SETUP.JIRA_CONNECTED_NOTE'),
    hasConfluence: integration.id === 'jira' && isConnected,
    isConfluenceOn: status?.confluence === true,
    confluenceLabel: isSwitching
      ? t('SETUP.CONFLUENCE_CHECKING')
      : t('SETUP.CONFLUENCE_SWITCH'),
    confluenceNote: t('SETUP.CONFLUENCE_NOTE'),
    confluenceError,
    onConfluence: async (isOn: boolean) => {
      if (isSwitching) return;

      setIsSwitching(true);
      setConfluenceError('');

      const switched = await Confluence.turn(isOn);

      setIsSwitching(false);

      if (!switched.isSwitched) {
        setConfluenceError(
          [t(CONFLUENCE_FAILURE_KEYS[switched.failure]), switched.said]
            .filter((part) => part !== '')
            .join(' '),
        );

        return;
      }

      landIntegration(switched.status);
    },
    install: isCli && cli.install?.phase !== 'installed' ? cli.install : null,
    signIn: isCli ? cli.signIn : null,
    fields: integration.fields.map((field) => ({
      id: field.id,
      label: t(field.labelKey),
      placeholder: field.placeholder,
      isSecret: field.isSecret,
      value: values[field.id] ?? '',
      onChange: (value: string) => {
        setValues((typed) => ({ ...typed, [field.id]: value }));
        setError('');
      },
    })),
    rows:
      status === undefined
        ? []
        : [
            { label: t('SETUP.ROW_ACCOUNT'), value: status.account },
            ...(isCli ? [{ label: t('SETUP.ROW_VIA'), value: t('SETUP.VIA_GH') }] : []),
            ...(status.site === null
              ? []
              : [{ label: t('SETUP.ROW_SITE'), value: status.site }]),
            {
              label: t('SETUP.ROW_SINCE'),
              value: formatDay({ iso: status.connectedAt, language }),
            },
          ],
    onAction: async () => {
      if (isConnected) {
        await Integrations.disconnect(integration.id);
        dropIntegration(integration.id);

        return;
      }

      if (!isCli) {
        setIsOpen((open) => !open);

        return;
      }

      if (isCliBusy) return;

      if (isCliMissing) await cli.onInstall();
      else cli.onConnect();
    },
    onInstall: async () => {
      await cli.onInstall();
    },
    onCancelSignIn: cli.onCancelSignIn,
    onCloseSignIn: cli.onCloseSignIn,
    onRetrySignIn: cli.onRetrySignIn,
    onCancel: () => {
      setIsOpen(false);
      setError('');

      if (isAsked) clearConnect();
    },
    onConnect: async () => {
      if (connection === null || isConnecting) return;

      setIsConnecting(true);
      setError('');

      const result = await Integrations.connect(connection);

      setIsConnecting(false);

      if (!result.isConnected) {
        const told = connectFailureOf({
          failure: result.failure,
          tracker: integration.name,
        });

        setError(t(told.key, told.values));

        return;
      }

      landIntegration(result.status);
      setValues({});
      setIsOpen(false);
    },
  };
};
