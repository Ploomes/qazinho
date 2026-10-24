import type { ProSignInProgress } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PRO_BILLING,
  PRO_ROLES,
  PRO_SITE_URL,
} from '@/modules/Pro/components/ProCard/constants';
import { Pro } from '@/services';
import { useProStore } from '@/store';

export const useProCardViewModel = () => {
  const { t } = useTranslation();
  const status = useProStore((state) => state.status);
  const setStatus = useProStore((state) => state.setStatus);
  const [signIn, setSignIn] = useState<ProSignInProgress | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    void Pro.status().then(setStatus);
  }, [setStatus]);

  useEffect(
    () =>
      Pro.onSignIn((progress) => {
        setSignIn((current) => (current === null ? current : progress));
      }),
    [],
  );

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
    setIsSigningOut(true);
    setStatus(await Pro.signOut());
    setIsSigningOut(false);
  };

  const signedIn = status?.isSignedIn === true ? status : null;
  const signedOut = status?.isSignedIn === false ? status : null;

  return {
    isLoading: status === null,
    isSignedIn: signedIn !== null,
    canSignIn: signedOut?.canKeepToken === true,
    hasNoKeychain: signedOut?.canKeepToken === false,
    subtitle:
      signedIn === null
        ? t('PRO.TAGLINE')
        : t('PRO.SIGNED_IN_AS', {
            account: signedIn.account.name ?? signedIn.account.email,
          }),
    email: signedIn?.account.email ?? null,
    machine: signedIn?.machine.name ?? null,
    isReachable: signedIn?.isReachable !== false,
    orgs: (signedIn?.orgs ?? []).map((org) => ({
      slug: org.slug,
      name: org.name,
      role: t(PRO_ROLES[org.role]),
      billing: t(PRO_BILLING[org.billingStatus].labelKey),
      billingClassName: `pro-card__billing pro-card__billing--${PRO_BILLING[org.billingStatus].tone}`,
    })),
    siteUrl: PRO_SITE_URL,
    signIn,
    isSigningOut,
    onSignIn: () => {
      void begin();
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
    onSignOut: () => {
      void signOut();
    },
  };
};
