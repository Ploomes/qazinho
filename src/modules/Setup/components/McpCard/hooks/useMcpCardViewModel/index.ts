import type { IMcpCardProps } from '@/modules/Setup/components/McpCard/types';
import type { McpActionResult, McpSignInResult } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MCP_LOOK } from '@/modules/Setup/components/McpCard/constants';
import { MCP_WAIT } from '@/modules/Setup/constants/MCP_WAIT';
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
  const [wait, setWait] = useState<{ until: number; via: 'terminal' | 'browser' } | null>(
    null,
  );

  const agentId = detected.find(({ name }) => name === agent)?.id ?? 'claude-code';
  const state =
    servers === null
      ? null
      : (servers.find(({ id }) => id === server.id)?.state ?? 'failed');
  const target = { id: server.id, agentId };
  const isWaiting = wait !== null && state !== 'connected';

  useEffect(() => {
    if (wait === null || state === 'connected') return;

    const timer = setInterval(() => {
      if (Date.now() > wait.until) setWait(null);
      else void Mcp.list(agentId).then(landMcpServers);
    }, MCP_WAIT.pollMs);

    return () => {
      clearInterval(timer);
    };
  }, [wait, state, agentId, landMcpServers]);

  const settle = async (result: McpActionResult | McpSignInResult) => {
    landMcpServers(await Mcp.list(agentId));

    if (!result.ok) setError(result.error);
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

  return {
    isConnected: state === 'connected',
    text: t(server.textKey),
    needs: t(server.needsKey, { agent }),
    pill: look.pill,
    statusLabel: t(look.labelKey),
    action: isBusy ? t('MCP.WORKING') : action,
    isQuiet: state === 'connected',
    isBusy,
    error,
    note:
      state === 'no-agent'
        ? t('MCP.NO_AGENT_NOTE', { agent })
        : state === 'unsupported'
          ? t('MCP.UNSUPPORTED_NOTE', { agent })
          : null,
    waiting: !isWaiting
      ? null
      : wait.via === 'terminal'
        ? t('MCP.WAITING_TERMINAL', { server: server.id })
        : t('MCP.WAITING_BROWSER', { name: server.name }),
    onAction: async () => {
      if (isBusy || action === null) return;

      setIsBusy(true);
      setError('');

      try {
        if (state === 'connected') {
          setWait(null);
          await settle(await Mcp.remove(target));

          return;
        }

        const connected = await Mcp.connect(target);

        await settle(connected);

        if (connected.ok)
          setWait({ until: Date.now() + MCP_WAIT.forMs, via: connected.via });
      } finally {
        setIsBusy(false);
      }
    },
  };
};
