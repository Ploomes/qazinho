import type { IOutsideAgent, IOutsideServer } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OUTSIDE_CARD } from '@/modules/Setup/components/OutsideServerCard/constants';
import { isConnectedOrg } from '@/modules/Setup/components/OutsideServerCard/library';
import { Outside } from '@/services';
import { useProStore, useSetupStore } from '@/store';

export const useOutsideServerCardViewModel = () => {
  const { t } = useTranslation();
  const [server, setServer] = useState<IOutsideServer | null>(null);
  const [agents, setAgents] = useState<IOutsideAgent[] | null>(null);
  const [doingId, setDoingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [isCopied, setCopied] = useState(false);
  const hasOrg = useProStore((state) => state.status?.isSignedIn === true);
  const isOrgOn = useSetupStore(
    (state) => state.mcpServers?.some(isConnectedOrg) === true,
  );
  const isOn = server?.isOn === true;

  useEffect(() => {
    void Outside.server().then(setServer);
  }, []);

  useEffect(() => {
    if (!isOn) return;

    let isCurrent = true;

    void Outside.agents().then((found) => {
      if (isCurrent) setAgents(found);
    });

    return () => {
      isCurrent = false;
    };
  }, [isOn]);

  useEffect(() => {
    if (!isCopied) return;

    const later = setTimeout(() => {
      setCopied(false);
    }, OUTSIDE_CARD.copiedMs);

    return () => {
      clearTimeout(later);
    };
  }, [isCopied]);

  const change = async (agent: IOutsideAgent) => {
    setDoingId(agent.id);
    setFailure(null);

    const done = await (agent.isAdded ? Outside.remove(agent.id) : Outside.add(agent.id));

    if (!done.ok) setFailure(done.error);

    setAgents(await Outside.agents());
    setDoingId(null);
  };

  return {
    isOn,
    isLit: isOn || (hasOrg && isOrgOn),
    hasOrg,
    isBusy: server?.isBusy === true,
    internSize: OUTSIDE_CARD.internPx,
    name: t('OUTSIDE.NAME'),
    about: t('OUTSIDE.ABOUT'),
    hereTitle: t('OUTSIDE.HERE_TITLE'),
    hereAbout: t('OUTSIDE.HERE_ABOUT'),
    switchLabel: t('OUTSIDE.SWITCH'),
    isChecking: agents === null,
    checkingText: t('OUTSIDE.CHECKING'),
    hasNoAgents: agents?.length === 0,
    noAgentsText: t('OUTSIDE.NO_AGENTS'),
    agents: (agents ?? []).map((agent) => ({
      id: agent.id,
      name: agent.name,
      isAdded: agent.isAdded,
      addedText: t('OUTSIDE.ADDED'),
      actionLabel: agent.isAdded ? t('OUTSIDE.REMOVE') : t('OUTSIDE.ADD'),
      isDoing: doingId === agent.id,
      onAction: () => {
        void change(agent);
      },
    })),
    hasAdded: agents?.some(({ isAdded }) => isAdded) === true,
    newSessionNote: t('OUTSIDE.NEW_SESSION'),
    failure,
    copyLabel: isCopied ? t('OUTSIDE.COPIED') : t('OUTSIDE.COPY'),
    copyIcon: isCopied ? ('check' as const) : ('copy' as const),
    copyNote: t('OUTSIDE.COPY_NOTE'),
    busyText: t('OUTSIDE.BUSY'),
    renewLabel: t('OUTSIDE.RENEW'),
    onToggle: (wanted: boolean) => {
      setFailure(null);
      setServer({ isOn: wanted, isBusy: false });
      void Outside.turn(wanted).then(setServer);
    },
    onCopy: () => {
      void Outside.copyAddress().then(setCopied);
    },
    onRenew: () => {
      void Outside.renew().then(async (renewed) => {
        setServer(renewed);
        setAgents(await Outside.agents());
      });
    },
  };
};
