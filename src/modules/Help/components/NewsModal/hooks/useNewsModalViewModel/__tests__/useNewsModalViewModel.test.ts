// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useNewsModalViewModel } from '@/modules/Help/components/NewsModal/hooks/useNewsModalViewModel';
import { APP_VERSION } from '@/modules/Settings/constants';
import { useAppStore } from '@/store';

beforeEach(async () => {
  await i18n.changeLanguage('pt');
  useAppStore.setState({ modal: 'news' });
});

describe('useNewsModalViewModel', () => {
  it('lists the versions this app has, newest first, each with its notes', () => {
    const { result } = renderHook(() => useNewsModalViewModel());
    const [newest] = result.current.releases;

    expect(newest?.version).toMatch(/^Versão \d/);
    expect(newest?.notes.length).toBeGreaterThan(0);
  });

  it('shows nothing newer than this app', () => {
    const { result } = renderHook(() => useNewsModalViewModel());
    const [newest] = result.current.releases;
    const [major = 0, minor = 0] = APP_VERSION.split('.').map(Number);
    const [newMajor = 0, newMinor = 0] = (newest?.key ?? '0.0.0').split('.').map(Number);

    expect(newMajor * 1000 + newMinor).toBeLessThanOrEqual(major * 1000 + minor);
  });

  it('closes', () => {
    const { result } = renderHook(() => useNewsModalViewModel());

    act(() => {
      result.current.onClose();
    });

    expect(useAppStore.getState().modal).toBeNull();
  });
});
