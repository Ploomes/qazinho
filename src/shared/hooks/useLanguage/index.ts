import { useEffect } from 'react';
import { i18n } from '@/languages';
import { useSettingsStore } from '@/store';

export const useLanguage = () => {
  const language = useSettingsStore((state) => state.language);

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [language]);
};
