import type { AgentSignInProgress } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useMachineCheck } from '@/modules/Setup/hooks/useMachineCheck';
import { Agent } from '@/services';
import { useMachineStore } from '@/store';

export const useAgentSignIn = () => {
  const agents = useMachineStore((state) => state.agents);
  const { check } = useMachineCheck();
  const [shown, setShown] = useState<{
    progress: AgentSignInProgress;
    name: string;
  } | null>(null);

  useEffect(
    () =>
      Agent.onSignIn((progress) => {
        setShown((current) =>
          current === null || current.progress.agentId !== progress.agentId
            ? current
            : { ...current, progress },
        );
      }),
    [],
  );

  const begin = async (agentId: string) => {
    setShown({
      progress: {
        agentId,
        steps: ['start', 'browser'],
        takesCode: false,
        phase: 'working',
        at: 'start',
        url: null,
      },
      name: agents.find(({ id }) => id === agentId)?.name ?? agentId,
    });

    const ended = await Agent.signIn(agentId);

    setShown((current) =>
      current === null || ended.phase === 'cancelled'
        ? null
        : { ...current, progress: ended },
    );

    if (ended.phase === 'connected') await check();
  };

  return {
    signIn: shown?.progress ?? null,
    signInAgent: shown?.name ?? '',
    onSignIn: (agentId: string) => {
      void begin(agentId);
    },
    onCancelSignIn: () => {
      if (shown !== null) void Agent.cancelSignIn(shown.progress.agentId);
      setShown(null);
    },
    onCloseSignIn: () => {
      setShown(null);
    },
    onRetrySignIn: () => {
      if (shown !== null) void begin(shown.progress.agentId);
    },
    onSignInCode: (code: string) => {
      if (shown !== null)
        void Agent.sendSignInCode({ agentId: shown.progress.agentId, code });
    },
  };
};
