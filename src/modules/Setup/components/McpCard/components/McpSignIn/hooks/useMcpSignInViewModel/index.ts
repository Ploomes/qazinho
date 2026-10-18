import type {
  IMcpSignInProps,
  McpSignInRowState,
  McpSignInTone,
} from '@/modules/Setup/components/McpCard/components/McpSignIn/types';
import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MCP_SIGN_IN,
  MCP_SIGN_IN_FAILURES,
  MCP_SIGN_IN_MARKS,
  MCP_SIGN_IN_STEPS,
} from '@/modules/Setup/components/McpCard/components/McpSignIn/constants';
import { MOTION } from '@/shared/constants';

export const useMcpSignInViewModel = (props: IMcpSignInProps) => {
  const { progress, onCancel, onClose } = props;
  const { t } = useTranslation();
  const names = { server: props.server.name, agent: props.agent };
  const failure = progress.phase === 'failed' ? progress : null;
  const working = progress.phase === 'working' ? progress : null;
  const isWorking = working !== null;
  const isConnected = progress.phase === 'connected';
  const at =
    progress.phase === 'working' || progress.phase === 'failed' ? progress.at : null;
  const reached = at === null ? progress.steps.length : progress.steps.indexOf(at);
  const tone: McpSignInTone = isConnected ? 'connected' : failure ? 'failed' : 'working';

  useEffect(() => {
    const leave = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (isWorking) onCancel();
      else onClose();
    };

    window.addEventListener('keydown', leave);

    return () => {
      window.removeEventListener('keydown', leave);
    };
  }, [isWorking, onCancel, onClose]);

  useEffect(() => {
    if (!isConnected) return;

    const timer = setTimeout(onClose, MCP_SIGN_IN.closeAfterMs);

    return () => {
      clearTimeout(timer);
    };
  }, [isConnected, onClose]);

  return {
    style: {
      '--sign-in-width': `${String(MCP_SIGN_IN.width)}px`,
      '--sign-in-badge': `${String(MCP_SIGN_IN.badge)}px`,
      '--sign-in-mark': `${String(MCP_SIGN_IN.mark)}px`,
      '--sign-in-detail': `${String(MCP_SIGN_IN.detailHeight)}px`,
    } as CSSProperties,
    tone,
    badgeClass: `mcp-sign-in__badge mcp-sign-in__badge--${tone}`,
    badgeMark: isConnected
      ? MCP_SIGN_IN_MARKS.done
      : failure
        ? MCP_SIGN_IN_MARKS.failed
        : null,
    title: isConnected
      ? t('MCP.SIGN_IN_DONE', names)
      : failure
        ? t('MCP.SIGN_IN_FAILED', names)
        : t('MCP.SIGN_IN_TITLE', names),
    subtitle: isConnected
      ? t('MCP.SIGN_IN_DONE_SUBTITLE', names)
      : failure
        ? t(MCP_SIGN_IN_FAILURES[failure.failure], names)
        : t('MCP.SIGN_IN_SUBTITLE', names),
    rows: progress.steps.map((step, index) => {
      const state: McpSignInRowState =
        index < reached
          ? 'done'
          : index > reached
            ? 'pending'
            : failure
              ? 'failed'
              : 'active';

      return {
        step,
        label: t(MCP_SIGN_IN_STEPS[step], names),
        state,
        className: `mcp-sign-in__step mcp-sign-in__step--${state}`,
        markClass: `mcp-sign-in__mark mcp-sign-in__mark--${state}`,
        mark: MCP_SIGN_IN_MARKS[state],
        delay: Math.min(index * MOTION.stagger, MOTION.maxStagger),
      };
    }),
    hint:
      working?.at === 'browser' && working.url !== null
        ? t('MCP.HINT_BROWSER', names)
        : working?.at === 'terminal'
          ? t('MCP.HINT_TERMINAL', names)
          : null,
    pageUrl: working?.at === 'browser' ? working.url : null,
    detail: failure !== null && failure.said !== '' ? failure.said : null,
    detailClass:
      failure?.failure === 'manual'
        ? 'mcp-sign-in__detail mcp-sign-in__detail--command'
        : 'mcp-sign-in__detail',
    isWorking,
    isConnected,
    isFailed: failure !== null,
    canRetry:
      failure !== null &&
      failure.failure !== 'unsupported' &&
      failure.failure !== 'manual',
    canUseTerminal: failure?.canUseTerminal ?? false,
    onBackdrop: () => {
      if (!isWorking) onClose();
    },
  };
};
