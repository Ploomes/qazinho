import type { IMcpCardProps } from '@/modules/Setup/components/McpCard/types';
import type { McpActionResult, McpSignInProgress } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MCP_LOOK } from '@/modules/Setup/components/McpCard/constants';
import { Mcp } from '@/services';
import { useMachineStore, useSettingsStore, useSetupStore } from '@/store';

export const useMcpCardViewModel = (props: IMcpCardProps) => {
  const { server } = props;
  const { t } = useTranslation();
  const servers = useSetupStore((store) => store.mcpServers);
  const landMcpServers = useSetupStore((store) => store.landMcpServers);
  const agent = useSettingsStore((store) => store.agent);
  const detected = useMachineStore((store) => store.agents);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [signIn, setSignIn] = useState<McpSignInProgress | null>(null);

  const agentId = detected.find(({ name }) => name === agent)?.id ?? 'claude-code';
  const state =
    servers === null
      ? null
      : (servers.find(({ id }) => id === server.id)?.state ?? 'failed');
  const target = { id: server.id, agentId };

  useEffect(
    () =>
      Mcp.onSignIn((progress) => {
        if (progress.target.id !== server.id || progress.target.agentId !== agentId)
          return;

        setSignIn((shown) => (shown === null ? null : progress));
      }),
    [server.id, agentId],
  );

  const settle = async (result: McpActionResult) => {
    landMcpServers(await Mcp.list(agentId));

    if (!result.ok) setError(result.error);
  };

  const begin = async (inTerminal: boolean) => {
    setError('');
    setSignIn({
      target,
      steps: ['check'],
      phase: 'working',
      at: 'check',
      url: null,
      opensAt: null,
    });

    const ended = await Mcp.connect({ target, inTerminal });

    setSignIn((shown) => (shown === null || ended.phase === 'cancelled' ? null : ended));
    landMcpServers(await Mcp.list(agentId));
  };

  const look = MCP_LOOK[state ?? 'checking'];
  const action =
    state === 'missing'
      ? t('MCP.ADD')
      : state === 'needs-auth' || state === 'failed'
        ? t('MCP.SIGN_IN')
        : state === 'connected'
          ? t('MCP.REMOVE')
          : null;
  const isWorking = isBusy || signIn !== null;

  return {
    isConnected: state === 'connected',
    text: t(server.textKey),
    pill: look === null ? null : look.pill,
    statusLabel: look === null ? '' : t(look.labelKey),
    action: isWorking ? t('MCP.WORKING') : action,
    isQuiet: state === 'connected',
    isBusy: isWorking,
    error,
    note:
      state === 'no-agent'
        ? t('MCP.NO_AGENT_NOTE', { agent })
        : state === 'unsupported'
          ? t('MCP.UNSUPPORTED_NOTE', { agent })
          : null,
    agent,
    signIn,
    onAction: async () => {
      if (isWorking || action === null) return;

      if (state !== 'connected') {
        await begin(false);

        return;
      }

      setIsBusy(true);
      setError('');

      try {
        await settle(await Mcp.remove(target));
      } finally {
        setIsBusy(false);
      }
    },
    onCancelSignIn: () => {
      setSignIn(null);
      void Mcp.cancel(target);
    },
    onCloseSignIn: () => {
      setSignIn(null);
    },
    onRetrySignIn: () => {
      void begin(false);
    },
    onSignInInTerminal: () => {
      void begin(true);
    },
  };
};
