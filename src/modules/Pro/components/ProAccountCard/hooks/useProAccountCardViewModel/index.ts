import type { ProDownloadState } from '@/modules/Pro/types';
import type { IProOrgProject, ProSignInProgress } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PRO_ACCOUNT_CARD,
  PRO_ATTENTION,
  PRO_DOWNLOAD_FAILURES,
} from '@/modules/Pro/components/ProAccountCard/constants';
import { PRO_BILLING, PRO_ROLES } from '@/modules/Pro/constants';
import { useOrgDownload } from '@/modules/Pro/hooks/useOrgDownload';
import { attentionOf, initialsOf } from '@/modules/Pro/library';
import { Pro } from '@/services';
import { useDismiss } from '@/shared/hooks';
import { useAppStore, useProStore, useSettingsStore } from '@/store';

export const useProAccountCardViewModel = () => {
  const { t } = useTranslation();
  const status = useProStore((state) => state.status);
  const setStatus = useProStore((state) => state.setStatus);
  const shares = useProStore((state) => state.shares);
  const orgProjects = useProStore((state) => state.orgProjects);
  const projects = useAppStore((state) => state.projects);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const bringHere = useOrgDownload();
  const isShut = useSettingsStore((state) => state.isSidebarShut);
  const toggleSidebar = useSettingsStore((state) => state.toggleSidebar);
  const [isOpen, setOpen] = useState(false);
  const [signIn, setSignIn] = useState<ProSignInProgress | null>(null);
  const [isSigningOut, setSigningOut] = useState(false);
  const [downloads, setDownloads] = useState<Record<string, ProDownloadState>>({});
  const ref = useDismiss<HTMLDivElement>(() => {
    setOpen(false);
  });

  useEffect(
    () =>
      Pro.onSignIn((progress) => {
        setSignIn((current) => (current === null ? current : progress));
      }),
    [],
  );

  const signedIn = status?.isSignedIn === true ? status : null;
  const org = signedIn?.orgs.find(({ slug }) => slug === signedIn.orgSlug) ?? null;
  const attention = attentionOf({ status, shares });
  const name = signedIn === null ? '' : (signedIn.account.name ?? signedIn.account.email);

  const begin = async () => {
    setSignIn({
      steps: ['code', 'browser', 'account'],
      phase: 'working',
      at: 'code',
      code: null,
      url: null,
    });

    const ended = await Pro.signIn();

    setSignIn((current) =>
      current === null || ended.phase === 'cancelled' ? null : ended,
    );

    if (ended.phase === 'connected') setStatus(await Pro.status());
  };

  const signOut = async () => {
    setSigningOut(true);
    setStatus(await Pro.signOut());
    setSigningOut(false);
    setOpen(false);
  };

  const choose = async (orgSlug: string) => {
    setStatus(await Pro.chooseOrg(orgSlug));
  };

  const download = async (offer: IProOrgProject) => {
    setDownloads((current) => ({ ...current, [offer.projectId]: 'working' }));

    const done = await bringHere({ orgSlug: offer.orgSlug, projectId: offer.projectId });

    if (!done.isDownloaded) {
      setDownloads((current) => ({ ...current, [offer.projectId]: done.failure }));

      return;
    }

    if (done.workspaceIds[0] !== undefined) selectWorkspace(done.workspaceIds[0]);

    setDownloads((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([id]) => id !== offer.projectId),
      ),
    );
    setOpen(false);
  };

  const title = signedIn === null ? t('PRO.CARD_SIGN_IN') : name;

  return {
    ref,
    isShown: status !== null,
    isSignedIn: signedIn !== null,
    className: isShut ? 'pro-account pro-account--shut' : 'pro-account',
    internSize: PRO_ACCOUNT_CARD.internSize,
    isOpen: isOpen && signedIn !== null && !isShut,
    hasTip: isShut,
    title,
    hasSubtitle: signedIn !== null,
    subtitle:
      signedIn === null
        ? ''
        : org === null
          ? t('PRO.CARD_NO_ORG')
          : t('PRO.CARD_ORG_LINE', { org: org.name, role: t(PRO_ROLES[org.role]) }),
    toggleLabel: signedIn === null ? t('PRO.CARD_SIGN_IN') : t('PRO.CARD_ACCOUNT'),
    popup: signedIn === null ? undefined : ('dialog' as const),
    isExpanded: signedIn === null ? undefined : isOpen,
    initials: initialsOf(name),
    hasAttention: attention !== null,
    attention: attention === null ? '' : t(PRO_ATTENTION[attention]),
    email: signedIn?.account.email ?? '',
    machine: t('PRO.CARD_MACHINE', { machine: signedIn?.machine.name ?? '' }),
    orgs: (signedIn?.orgs ?? []).map((one) => {
      const isOn = one.slug === signedIn?.orgSlug;
      const isDisabled = one.role === 'reader';

      return {
        slug: one.slug,
        name: one.name,
        note: t('PRO.CARD_ORG_NOTE', {
          role: t(PRO_ROLES[one.role]),
          billing: t(PRO_BILLING[one.billingStatus].labelKey),
        }),
        isOn,
        isDisabled,
        className: [
          'pro-account__org',
          isOn ? 'pro-account__org--on' : '',
          isDisabled ? 'pro-account__org--off' : '',
        ]
          .filter(Boolean)
          .join(' '),
        onClick: () => {
          if (!isOn && !isDisabled) void choose(one.slug);
        },
      };
    }),
    offers: orgProjects
      .filter(
        (offer) =>
          offer.orgSlug === signedIn?.orgSlug &&
          !projects.some(({ id }) => id === offer.projectId),
      )
      .map((offer) => {
        const state = downloads[offer.projectId];
        const isWorking = state === 'working';

        return {
          key: offer.projectId,
          name: offer.name,
          meta:
            offer.plans.length === 1
              ? t('PRO.PLANS_ONE')
              : t('PRO.PLANS_OTHER', { count: offer.plans.length }),
          isWorking,
          label: isWorking ? t('PRO.DOWNLOADING') : t('PRO.DOWNLOAD'),
          failure:
            state === undefined || state === 'working'
              ? null
              : t(PRO_DOWNLOAD_FAILURES[state]),
          onDownload: () => {
            if (!isWorking) void download(offer);
          },
        };
      }),
    canOpenSite:
      signedIn !== null && (signedIn.orgSlug !== null || signedIn.orgs.length === 0),
    signIn,
    isSigningOut,
    onToggle: () => {
      if (signedIn === null) {
        void begin();

        return;
      }

      if (isShut) {
        toggleSidebar();
        setOpen(true);

        return;
      }

      setOpen((open) => !open);
    },
    onCancelSignIn: () => {
      void Pro.cancelSignIn();
      setSignIn(null);
    },
    onCloseSignIn: () => {
      setSignIn(null);
    },
    onRetrySignIn: () => {
      void begin();
    },
    onOpenSite: () => {
      if (signedIn?.orgSlug)
        void Pro.openPage(`/${encodeURIComponent(signedIn.orgSlug)}`);
      else if (signedIn?.orgs.length === 0) void Pro.openPage('/app/new');

      setOpen(false);
    },
    onSignOut: () => {
      void signOut();
    },
  };
};
