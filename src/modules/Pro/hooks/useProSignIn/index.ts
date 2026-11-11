import type { ProSignInProgress } from '@/shared/types';
import { useEffect, useState } from 'react';
import { Pro } from '@/services';
import { useProStore } from '@/store';

export const useProSignIn = () => {
  const setStatus = useProStore((state) => state.setStatus);
  const [signIn, setSignIn] = useState<ProSignInProgress | null>(null);

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

  return {
    signIn,
    onBegin: () => {
      void begin();
    },
    onCancel: () => {
      void Pro.cancelSignIn();
      setSignIn(null);
    },
    onClose: () => {
      setSignIn(null);
    },
  };
};
