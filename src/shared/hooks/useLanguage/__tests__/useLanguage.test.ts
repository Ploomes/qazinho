// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useSettingsStore } from '@/store';

afterEach(async () => {
  await i18n.changeLanguage('en');
  useSettingsStore.setState({ language: 'en' });
});

describe('useLanguage', () => {
  it('leaves i18next alone when it already speaks what was chosen', () => {
    renderHook(() => useLanguage());

    expect(i18n.language).toBe('en');
  });

  it('swaps the strings when the QA picks another language', async () => {
    useSettingsStore.setState({ language: 'pt' });

    renderHook(() => useLanguage());

    await waitFor(() => {
      expect(i18n.language).toBe('pt');
    });
    expect(i18n.t('COMMON.CANCEL')).toBe('Cancelar');
  });
});
