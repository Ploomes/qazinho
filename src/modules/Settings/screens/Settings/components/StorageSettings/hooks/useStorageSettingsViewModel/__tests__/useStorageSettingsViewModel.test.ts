// @vitest-environment jsdom
import type { IStorageUsage } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useStorageSettingsViewModel } from '@/modules/Settings/screens/Settings/components/StorageSettings/hooks/useStorageSettingsViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSettingsStore } from '@/store';

const MB = 1024 * 1024;
const sweeps: number[] = [];

const USAGE: IStorageUsage = {
  videos: 82 * MB,
  screens: 25 * MB,
  builds: 0,
  other: 43 * MB,
  total: 150 * MB,
};

beforeEach(async () => {
  await i18n.changeLanguage('en');
  sweeps.length = 0;
  useSettingsStore.setState({ language: 'en', videoKeepDays: 30 });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    storageUsage: () => Promise.resolve(USAGE),
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
  describe('while it measures', () => {
    it('lists the kinds by name right away, with their numbers still to come', () => {
      const { result } = renderHook(() => useStorageSettingsViewModel());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hero).toBeNull();
      expect(
        result.current.rows.map(
          ({ label, isPending }) => `${label}: ${String(isPending)}`,
        ),
      ).toEqual([
        'Run videos: true',
        'Run screens: true',
        'Apps built from code: true',
        'The rest: projects, browser profiles and logs: true',
      ]);
      expect(result.current.segments).toEqual([]);
    });
  });

  describe('once it measured', () => {
    it('says the total as a number and its unit, and what it counts', async () => {
      const { result } = renderHook(() => useStorageSettingsViewModel());

      await waitFor(() => {
        expect(result.current.hero).toEqual({ value: '150', unit: 'MB' });
      });
      expect(result.current.caption).toBe('used by QAzinho on this computer');
      expect(result.current.isLoading).toBe(false);
    });

    it('gives each kind its size and its share of the total', async () => {
      const { result } = renderHook(() => useStorageSettingsViewModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(
        result.current.rows.map(
          ({ label, size, share }) => `${label}: ${size} · ${share}`,
        ),
      ).toEqual([
        'Run videos: 82 MB · 55%',
        'Run screens: 25 MB · 17%',
        'Apps built from code: 0 kB · 0%',
        'The rest: projects, browser profiles and logs: 43 MB · 29%',
      ]);
    });

    it('draws a slice of the bar only for a kind that holds something', async () => {
      const { result } = renderHook(() => useStorageSettingsViewModel());

      await waitFor(() => {
        expect(result.current.segments.map(({ id }) => id)).toEqual([
          'videos',
          'screens',
          'other',
        ]);
      });
    });

    it('does NOT call an empty computer a bar: it says the bar is empty', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        storageUsage: () =>
          Promise.resolve({ videos: 0, screens: 0, builds: 0, other: 0, total: 0 }),
      };

      const { result } = renderHook(() => useStorageSettingsViewModel());

      await waitFor(() => {
        expect(result.current.isEmpty).toBe(true);
      });
      expect(result.current.segments).toEqual([]);
    });
  });

  describe('pointing at a kind', () => {
    it('lights that kind up and dims the others, then lets go when the pointer leaves', async () => {
      const { result } = renderHook(() => useStorageSettingsViewModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onActivate('videos');
      });

      expect(
        result.current.rows.map(({ className }) =>
          className.includes('--active')
            ? 'active'
            : className.includes('--dim')
              ? 'dim'
              : 'plain',
        ),
      ).toEqual(['active', 'dim', 'dim', 'dim']);
      expect(
        result.current.segments.map(({ segmentClassName }) =>
          segmentClassName.includes('--dim'),
        ),
      ).toEqual([false, true, true]);

      act(() => {
        result.current.onDeactivate();
      });

      expect(
        result.current.rows.some(({ className }) => className.includes('--dim')),
      ).toBe(false);
    });
  });

  describe('the retention', () => {
    it('offers the four spans and marks the one the QA keeps', () => {
      const { result } = renderHook(() => useStorageSettingsViewModel());

      expect(result.current.keepOptions.map(({ label }) => label)).toEqual([
        '7 days',
        '30 days',
        '90 days',
        'Always',
      ]);
      expect(result.current.keepValue).toBe('30');
    });

    it('keeps videos for the days picked, and for good with Always', () => {
      const { result } = renderHook(() => useStorageSettingsViewModel());

      act(() => {
        result.current.onKeepChange('always');
      });

      expect(useSettingsStore.getState().videoKeepDays).toBeNull();
      expect(result.current.canSweep).toBe(false);
      expect(result.current.keepValue).toBe('always');
    });

    it('says what the pick means, in words that change with it', () => {
      const { result } = renderHook(() => useStorageSettingsViewModel());

      expect(result.current.rule).toBe(
        'Videos older than 30 days are deleted on their own.',
      );

      act(() => {
        result.current.onKeepChange('always');
      });

      expect(result.current.rule).toBe(
        'No video is deleted on its own: they stay until you delete them.',
      );
      expect(result.current.ruleKey).toBe('always');
    });

    it('does NOT mark a span when the saved days match none of the four', () => {
      useSettingsStore.setState({ videoKeepDays: 14 });

      const { result } = renderHook(() => useStorageSettingsViewModel());

      expect(result.current.keepValue).toBe('');
    });
  });

  describe('onSweep', () => {
    it('deletes the old videos now, says what it freed, and measures again', async () => {
      const { result } = renderHook(() => useStorageSettingsViewModel());

      act(() => {
        result.current.onSweep();
      });

      await waitFor(() => {
        expect(result.current.sweptLine).toBe('2 videos deleted, 82 MB freed.');
      });
      expect(result.current.sweptTone).toBe('done');
      expect(result.current.sweptIcon).toBe('passed');
      expect(sweeps).toEqual([30]);
    });

    it('says plainly when no video was old enough, without the success mark', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        storageUsage: () => Promise.resolve(USAGE),
        sweepVideos: () => Promise.resolve({ removed: 0, freedBytes: 0 }),
      };

      const { result } = renderHook(() => useStorageSettingsViewModel());

      act(() => {
        result.current.onSweep();
      });

      await waitFor(() => {
        expect(result.current.sweptLine).toBe('No video was old enough to delete.');
      });
      expect(result.current.sweptTone).toBe('none');
      expect(result.current.sweptIcon).toBe('skipped');
    });

    it('forgets what it freed once the QA picks another span', async () => {
      const { result } = renderHook(() => useStorageSettingsViewModel());

      act(() => {
        result.current.onSweep();
      });
      await waitFor(() => {
        expect(result.current.sweptLine).not.toBeNull();
      });

      act(() => {
        result.current.onKeepChange('7');
      });

      expect(result.current.sweptLine).toBeNull();
    });

    it('holds the last reading, dimmed, while it measures again', async () => {
      let release: (usage: IStorageUsage) => void = () => undefined;
      let reads = 0;

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        storageUsage: () => {
          reads += 1;

          return reads === 1
            ? Promise.resolve(USAGE)
            : new Promise<IStorageUsage>((resolve) => {
                release = resolve;
              });
        },
        sweepVideos: () => Promise.resolve({ removed: 2, freedBytes: 82 * MB }),
      };

      const { result } = renderHook(() => useStorageSettingsViewModel());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onSweep();
      });

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(true);
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hero).toEqual({ value: '150', unit: 'MB' });

      act(() => {
        release({ ...USAGE, videos: 0, total: 68 * MB });
      });

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false);
      });
      expect(result.current.hero).toEqual({ value: '68', unit: 'MB' });
    });
  });
});
