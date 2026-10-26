// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useStorageSettingsViewModel } from '@/modules/Settings/screens/Settings/components/StorageSettings/hooks/useStorageSettingsViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSettingsStore } from '@/store';

const MB = 1024 * 1024;
const sweeps: number[] = [];

beforeEach(async () => {
  await i18n.changeLanguage('en');
  sweeps.length = 0;
  useSettingsStore.setState({ language: 'en', videoKeepDays: 30 });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    storageUsage: () =>
      Promise.resolve({
        videos: 82 * MB,
        screens: 25 * MB,
        builds: 0,
        other: 43 * MB,
        total: 150 * MB,
      }),
    sweepVideos: (days: number) => {
      sweeps.push(days);

      return Promise.resolve({ removed: 2, freedBytes: 82 * MB });
    },
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useStorageSettingsViewModel', () => {
  it('says what QAzinho keeps on this computer, by kind', async () => {
    const { result } = renderHook(() => useStorageSettingsViewModel());

    await waitFor(() => {
      expect(result.current.total).toBe('QAzinho keeps 150 MB on this computer.');
    });
    expect(result.current.rows.map(({ label, size }) => `${label}: ${size}`)).toEqual([
      'Run videos: 82 MB',
      'Run screens: 25 MB',
      'Apps built from code: 0 kB',
      'The rest: projects, browser profiles and logs: 43 MB',
    ]);
  });

  it('keeps videos for the days picked, and for good with Always', () => {
    const { result } = renderHook(() => useStorageSettingsViewModel());

    expect(
      result.current.keeping.map(({ className }) => className.includes('--on')),
    ).toEqual([false, true, false, false]);
    act(() => {
      result.current.keeping[3]?.onPick();
    });

    expect(useSettingsStore.getState().videoKeepDays).toBeNull();
    expect(result.current.canSweep).toBe(false);
  });

  it('deletes the old videos now, says what it freed, and measures again', async () => {
    const { result } = renderHook(() => useStorageSettingsViewModel());

    act(() => {
      result.current.onSweep();
    });

    await waitFor(() => {
      expect(result.current.sweptLine).toBe('2 videos deleted, 82 MB freed.');
    });
    expect(sweeps).toEqual([30]);
  });
});
