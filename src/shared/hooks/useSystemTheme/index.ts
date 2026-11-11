import { useEffect } from 'react';
import { useAppStore } from '@/store';

export const useSystemTheme = () => {
  const setSystemTheme = useAppStore((state) => state.setSystemTheme);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const dark = window.matchMedia('(prefers-color-scheme: dark)');
    const read = () => {
      setSystemTheme(dark.matches ? 'dark' : 'light');
    };

    read();
    dark.addEventListener('change', read);

    return () => {
      dark.removeEventListener('change', read);
    };
  }, [setSystemTheme]);
};
