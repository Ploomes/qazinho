import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resolveLanguage } from '@/languages/library';
import { en, pt } from '@/languages/locales';

export const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, pt: { translation: pt } },
  lng: resolveLanguage(navigator.language),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
