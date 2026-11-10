import type { GithubSignInProgress, IGithubStatus } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInstall } from '@/modules/Setup/hooks/useInstall';
import { connectFailureOf } from '@/modules/Setup/library';
import { Github, Integrations } from '@/services';
import { useSetupStore } from '@/store';

export const useGithubConnect = (props: { isOn: boolean }) => {
  const { isOn } = props;
  const { t } = useTranslation();
  const landIntegration = useSetupStore((state) => state.landIntegration);
  const { installs, install } = useInstall();
  const [status, setStatus] = useState<IGithubStatus | null>(null);
  const [signIn, setSignIn] = useState<GithubSignInProgress | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOn) return;

    void Github.status().then(setStatus);
  }, [isOn]);

  useEffect(() => {
    if (!isOn) return;

    return Github.onSignIn((progress) => {
      setSignIn((current) => (current === null ? current : progress));
    });
  }, [isOn]);

  const look = async () => {
    const seen = await Github.status();

    setStatus(seen);

    return seen;
  };

  const begin = async () => {
    setError('');
    setSignIn({
      steps: ['code', 'browser', 'account'],
      phase: 'working',
      at: 'code',
      code: null,
      url: null,
    });

    const ended = await Github.signIn();

    if (ended.phase === 'connected') {
      const result = await Integrations.connect({ id: 'github' });

      if (result.isConnected) landIntegration(result.status);
      else {
        const told = connectFailureOf({ failure: result.failure, tracker: 'GitHub' });

        setError(t(told.key, told.values));
        setSignIn(null);
        await look();

        return;
      }
    }

    setSignIn((current) =>
      current === null || ended.phase === 'cancelled' ? null : ended,
    );
    await look();
  };

  return {
    status,
    signIn,
    error,
    install: installs.gh ?? null,
    onConnect: () => {
      void begin();
    },
    onInstall: async () => {
      await install('gh');

      return (await look()).cli.isFound;
    },
    onCancelSignIn: () => {
      void Github.cancelSignIn();
      setSignIn(null);
    },
    onCloseSignIn: () => {
      setSignIn(null);
    },
    onRetrySignIn: () => {
      void begin();
    },
  };
};
