import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PRO_ATTENTION } from '@/modules/Pro/components/ProAccountCard/constants';
import { PRO_BILLING, PRO_ROLES } from '@/modules/Pro/constants';
import { useProSignIn } from '@/modules/Pro/hooks/useProSignIn';
import { attentionOf, initialsOf } from '@/modules/Pro/library';
import { Pro } from '@/services';
import { useDismiss } from '@/shared/hooks';
import { useProStore, useSettingsStore } from '@/store';

export const useProAccountCardViewModel = () => {
  const { t } = useTranslation();
  const status = useProStore((state) => state.status);
  const setStatus = useProStore((state) => state.setStatus);
  const shares = useProStore((state) => state.shares);
  const isShut = useSettingsStore((state) => state.isSidebarShut);
  const toggleSidebar = useSettingsStore((state) => state.toggleSidebar);
  const [isOpen, setOpen] = useState(false);
  const [isCloning, setCloning] = useState(false);
  const [isSigningOut, setSigningOut] = useState(false);
  const { signIn, onBegin, onCancel, onClose } = useProSignIn();
  const ref = useDismiss<HTMLDivElement>(() => {
    setOpen(false);
  });

  const signedIn = status?.isSignedIn === true ? status : null;
  const orgs = signedIn?.orgs ?? [];
  const onlyOrg = orgs.length === 1 ? orgs[0] : undefined;
  const attention = attentionOf({ status, shares });
  const name = signedIn === null ? '' : (signedIn.account.name ?? signedIn.account.email);

  const signOut = async () => {
    setSigningOut(true);
    setStatus(await Pro.signOut());
    setSigningOut(false);
    setOpen(false);
  };

  const title = signedIn === null ? t('PRO.CARD_ENTER') : name;

  return {
    ref,
    isShown: status !== null,
    isSignedIn: signedIn !== null,
    className: isShut ? 'pro-account pro-account--shut' : 'pro-account',
    isOpen: isOpen && signedIn !== null && !isShut,
    hasTip: isShut,
    title,
    hasSubtitle: signedIn !== null,
    subtitle:
      signedIn === null
        ? ''
        : onlyOrg !== undefined
          ? t('PRO.CARD_ORG_LINE', {
              org: onlyOrg.name,
              role: t(PRO_ROLES[onlyOrg.role]),
            })
          : orgs.length === 0
            ? t('PRO.CARD_NO_ORG')
            : t('PRO.CARD_ORGS_OTHER', { count: orgs.length }),
    toggleLabel: signedIn === null ? t('PRO.CARD_SIGN_IN') : t('PRO.CARD_ACCOUNT'),
    popup: signedIn === null ? undefined : ('dialog' as const),
    isExpanded: signedIn === null ? undefined : isOpen,
    initials: initialsOf(name),
    hasAttention: attention !== null,
    attention: attention === null ? '' : t(PRO_ATTENTION[attention]),
    email: signedIn?.account.email ?? '',
    machine: t('PRO.CARD_MACHINE', { machine: signedIn?.machine.name ?? '' }),
    machineName: signedIn?.machine.name ?? '',
    orgs: orgs.map((one) => ({
      slug: one.slug,
      name: one.name,
      status: t(PRO_BILLING[one.billingStatus].labelKey),
      tone: PRO_BILLING[one.billingStatus].tone,
      role: t(PRO_ROLES[one.role]),
    })),
    hasOrgs: orgs.length > 0,
    isCloning,
    signIn,
    isSigningOut,
    onToggle: () => {
      if (signedIn === null) {
        onBegin();

        return;
      }

      if (isShut) {
        toggleSidebar();
        setOpen(true);

        return;
      }

      setOpen((open) => !open);
    },
    onClone: () => {
      setOpen(false);
      setCloning(true);
    },
    onCloseClone: () => {
      setCloning(false);
    },
    onCancelSignIn: onCancel,
    onCloseSignIn: onClose,
    onRetrySignIn: onBegin,
    onOpenSite: () => {
      if (onlyOrg !== undefined)
        void Pro.openPage(`/${encodeURIComponent(onlyOrg.slug)}`);
      else void Pro.openPage(orgs.length === 0 ? '/app/new' : '/app');

      setOpen(false);
    },
    onSignOut: () => {
      void signOut();
    },
  };
};
