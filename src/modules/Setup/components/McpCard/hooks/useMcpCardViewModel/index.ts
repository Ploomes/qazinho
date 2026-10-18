import type { IMcpCardProps } from '@/modules/Setup/components/McpCard/types';
import type { McpActionResult } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MCP_LOOK } from '@/modules/Setup/components/McpCard/constants';
import { MCP_WAIT } from '@/modules/Setup/constants/MCP_WAIT';
import { Mcp } from '@/services';
import { useSettingsStore, useSetupStore } from '@/store';

export const useMcpCardViewModel = (props: IMcpCardProps) => {
  const { server } = props;
  const { t } = useTranslation();
  const state = useSetupStore(
    (store) => store.mcpServers?.find(({ id }) => id === server.id)?.state ?? null,
  );
  const landMcpServers = useSetupStore((store) => store.landMcpServers);
  const agent = useSettingsStore((store) => store.agent);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [waitUntil, setWaitUntil] = useState<number | null>(null);
  const isWaiting = waitUntil !== null && state !== 'connected';

  useEffect(() => {
    if (waitUntil === null || state === 'connected') return;

    const timer = setInterval(() => {
      if (Date.now() > waitUntil) setWaitUntil(null);
      else void Mcp.list().then(landMcpServers);
    }, MCP_WAIT.pollMs);

    return () => {
      clearInterval(timer);
    };
  }, [waitUntil, state, landMcpServers]);

  const settle = async (result: McpActionResult): Promise<boolean> => {
    landMcpServers(await Mcp.list());

    if (!result.ok) setError(result.error);

    return result.ok;
  };

  const signIn = async () => {
    if (await settle(await Mcp.signIn(server.id)))
      setWaitUntil(Date.now() + MCP_WAIT.forMs);
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
    needs: t(server.needsKey),
    pill: look.pill,
    statusLabel: t(look.labelKey),
    action: isBusy ? t('MCP.WORKING') : action,
    isQuiet: state === 'connected',
    isBusy,
    error,
    note:
      state === 'no-agent'
        ? t('MCP.NO_CLAUDE')
        : agent !== 'Claude Code'
          ? t('MCP.ONLY_CLAUDE', { agent })
          : null,
    waiting: isWaiting ? t('MCP.WAITING', { server: server.id }) : null,
    onAction: async () => {
      if (isBusy || action === null) return;

      setIsBusy(true);
      setError('');

      try {
        if (state === 'missing') {
          if (await settle(await Mcp.add(server.id))) await signIn();
        } else if (state === 'connected') {
          setWaitUntil(null);
          await settle(await Mcp.remove(server.id));
        } else await signIn();
      } finally {
        setIsBusy(false);
      }
    },
  };
};
