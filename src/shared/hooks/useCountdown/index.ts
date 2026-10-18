import { useEffect, useState } from 'react';
import { COUNTDOWN } from '@/shared/constants';

export const useCountdown = (until: number | null) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until === null) return;

    const tick = () => {
      setNow(Date.now());
    };
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, COUNTDOWN.tickMs);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [until]);

  return until === null ? null : Math.max(0, Math.ceil((until - now) / 1_000));
};
