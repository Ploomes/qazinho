// @vitest-environment jsdom
import type { IBuild } from '@/modules/Build/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useBuildProgressViewModel } from '@/modules/Build/components/BuildProgress/hooks/useBuildProgressViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useBuildStore, useSettingsStore } from '@/store';

const WORKING: IBuild = {
  id: 'b1',
  projectId: 'p1',
  platform: 'android',
  repository: 'acme/loja-app',
  branch: 'main',
  startedAt: 1_000,
  phase: 'working',
  step: 'agent',
  bytes: 0,
  lines: ['$ npm ci', '$ ./gradlew assembleRelease'],
  result: null,
};

const progress = (onRetry = vi.fn()) =>
  renderHook(() => useBuildProgressViewModel({ buildId: 'b1', onRetry }));

beforeEach(async () => {
  await i18n.changeLanguage('en');
  useSettingsStore.setState({ agent: 'Claude Code' });
  useBuildStore.setState({ builds: [WORKING] });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    stopBuild: vi.fn(() => Promise.resolve()),
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useBuildProgressViewModel', () => {
  it('says what it builds, the step it is on, and what the agent just did', () => {
    const { result } = progress();

    expect(result.current).toMatchObject({
      title: 'An .apk of acme/loja-app, branch main',
      mood: 'running',
      isWorking: true,
      lines: ['$ npm ci', '$ ./gradlew assembleRelease'],
    });
    expect(
      result.current?.steps.map(({ className, label }) => [className, label]),
    ).toEqual([
      ['build-progress__step build-progress__step--done', 'Getting the code'],
      ['build-progress__step build-progress__step--doing', 'Claude Code builds it'],
      ['build-progress__step build-progress__step--waiting', 'Checking what it made'],
    ]);
  });

  it('counts the time the build has taken, every second while it goes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(61_000);

    const { result } = progress();

    expect(result.current?.elapsed).toBe('1:00');

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(result.current?.elapsed).toBe('1:05');
  });

  it('says what was built and that it is the project target now', () => {
    useBuildStore.setState({
      builds: [
        {
          ...WORKING,
          phase: 'built',
          step: 'artifact',
          result: {
            isBuilt: true,
            artifact: '/apps/p1/acme-loja-app-main-c0ffee1.apk',
            bytes: 2 * 1024 * 1024,
            commit: 'c0ffee1',
            summary: '',
          },
        },
      ],
    });

    const { result } = progress();

    expect(result.current).toMatchObject({
      built: 'Built: acme-loja-app-main-c0ffee1.apk, 2 MB',
      builtNote: 'The project tests it now.',
      lines: [],
      hasActions: false,
      mood: 'passed',
    });
  });

  it('says why a build failed in words the QA reads, and offers to try again', () => {
    const onRetry = vi.fn();

    useBuildStore.setState({
      builds: [
        {
          ...WORKING,
          phase: 'failed',
          result: {
            isBuilt: false,
            failure: { reason: 'agent', failure: { reason: 'agent-signed-out' } },
          },
        },
      ],
    });

    const { result } = progress(onRetry);

    expect(result.current?.failed).toBe(
      'The build stopped: Claude Code is signed out. Sign it in from Settings → Agent, then build again.',
    );
    expect(result.current?.steps[1]?.icon).toBe('failed');

    act(() => {
      result.current?.onRetry();
    });

    expect(onRetry).toHaveBeenCalled();
  });

  describe('onStop', () => {
    it('asks main to stop the build', () => {
      const { result } = progress();

      act(() => {
        result.current?.onStop();
      });

      expect(window.qazinho.stopBuild).toHaveBeenCalledWith('b1');
    });
  });

  it('shows nothing for a build it does not know', () => {
    useBuildStore.setState({ builds: [] });

    expect(progress().result.current).toBeNull();
  });
});
