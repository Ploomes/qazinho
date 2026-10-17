import { LANGUAGES } from '@/modules/Settings';
import { useSettingsStore } from '@/store';

export const useStepWelcomeViewModel = () => {
  const language = useSettingsStore((state) => state.language);
  const selectLanguage = useSettingsStore((state) => state.selectLanguage);

  return {
    languages: LANGUAGES.map((item) => ({
      ...item,
      isActive: item.id === language,
      onSelect: () => {
        selectLanguage(item.id);
      },
    })),
  };
};
