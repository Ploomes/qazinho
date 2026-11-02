import { useTranslation } from 'react-i18next';
import { SETUP_LINKS } from '@/modules/Setup/constants';
import { useAgentSignIn, useInstall, useMachineCheck } from '@/modules/Setup/hooks';
import { installableAgentOf } from '@/modules/Setup/library';
import { useMachineStore, useSettingsStore, useSetupStore } from '@/store';

export const useStepAgentsViewModel = () => {
  const { t } = useTranslation();
  const agents = useMachineStore((state) => state.agents);
  const managers = useSetupStore((state) => state.managers);
  const agentInUse = useSettingsStore((state) => state.agent);
  const selectAgent = useSettingsStore((state) => state.selectAgent);
  const { installs, install } = useInstall();
  const { isChecking, check } = useMachineCheck();
  const signIn = useAgentSignIn();
  const hasNpm = managers?.npm.isFound ?? false;

  return {
    ...signIn,
    isChecking,
    needsNpm: managers !== null && !hasNpm && agents.some(({ isFound }) => !isFound),
    nodeUrl: SETUP_LINKS.nodejs,
    hasAgent: agents.some(({ isFound, isSignedIn }) => isFound && isSignedIn !== false),
    rows: agents.map((agent) => {
      const item = installableAgentOf(agent.id);
      const state = item === null ? undefined : installs[item];
      const isInUse = agent.isFound && agent.name === agentInUse;
      const isSignedOut = agent.isFound && agent.isSignedIn === false;

      return {
        id: agent.id,
        name: agent.name,
        state: agent.isFound && !isSignedOut ? ('found' as const) : ('missing' as const),
        badge: isSignedOut
          ? t('SETUP.SIGNED_OUT')
          : isInUse
            ? t('SETUP.AGENT_IN_USE')
            : agent.isFound
              ? t('SETUP.FOUND')
              : t('SETUP.MISSING'),
        detail: agent.isFound ? undefined : t('SETUP.NOT_ON_MACHINE'),
        isInUse,
        canInstall:
          !agent.isFound && item !== null && hasNpm && state?.phase !== 'installing',
        install: state ?? null,
        canSignIn: isSignedOut,
        onUse: () => {
          selectAgent(agent.name);
        },
        onInstall: () => {
          if (item !== null) void install(item);
        },
        onSignIn: () => {
          signIn.onSignIn(agent.id);
        },
      };
    }),
    onCheckAgain: () => {
      void check();
    },
  };
};
