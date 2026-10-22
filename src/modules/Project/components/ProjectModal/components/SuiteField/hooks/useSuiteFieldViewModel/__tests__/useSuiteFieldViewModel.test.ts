// @vitest-environment jsdom
import type { ISuite, SuitePick } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSuiteFieldViewModel } from '@/modules/Project/components/ProjectModal/components/SuiteField/hooks/useSuiteFieldViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSuiteStore } from '@/store';

const SUITE: ISuite = {
  projectId: 'p1',
  path: '/qa/e2e',
  name: 'chat-e2e',
  config: 'playwright.config.ts',
  version: '1.64.1',
  branch: 'main',
  repository: 'acme/chat-e2e',
  envKeys: ['BASE_URL', 'USER_KEY', 'PROJECT_ID'],
  envFileKeys: ['BASE_URL', 'USER_KEY'],
};

let forgotten: string[] = [];
let pick: SuitePick = { kind: 'picked', suite: SUITE };

beforeEach(() => {
  forgotten = [];
  pick = { kind: 'picked', suite: SUITE };
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    pickSuite: () => Promise.resolve(pick),
    forgetSuite: (projectId) => {
      forgotten.push(projectId);

      return Promise.resolve();
    },
  };
  useSuiteStore.setState({ suites: {}, lists: {}, runs: {}, live: {}, picked: {} });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useSuiteFieldViewModel', () => {
  describe('onPick', () => {
    it('connects the folder the QA picked and shows what it holds', async () => {
      const { result } = renderHook(() =>
        useSuiteFieldViewModel({ projectId: 'p1', variableNames: [] }),
      );

      act(() => {
        result.current.onPick();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
      expect(result.current).toMatchObject({
        name: 'chat-e2e',
        runner: 'Playwright 1.64.1',
        branch: 'main',
        repository: 'acme/chat-e2e',
        hasPackages: true,
      });
    });

    it('says why a folder with no Playwright suite was refused, and connects nothing', async () => {
      pick = { kind: 'failed', reason: 'no-playwright' };

      const { result } = renderHook(() =>
        useSuiteFieldViewModel({ projectId: 'p1', variableNames: [] }),
      );

      act(() => {
        result.current.onPick();
      });

      await waitFor(() => {
        expect(result.current.hasRefused).toBe(true);
      });
      expect(result.current.isConnected).toBe(false);
    });

    it('does NOT connect a project that does not exist yet', () => {
      const { result } = renderHook(() =>
        useSuiteFieldViewModel({ projectId: null, variableNames: [] }),
      );

      act(() => {
        result.current.onPick();
      });

      expect(result.current).toMatchObject({ canConnect: false, isPicking: false });
    });
  });

  describe('settings', () => {
    it('says where each setting the tests read comes from, a project variable first', () => {
      useSuiteStore.setState({ suites: { p1: SUITE } });

      const { result } = renderHook(() =>
        useSuiteFieldViewModel({ projectId: 'p1', variableNames: ['USER_KEY'] }),
      );

      expect(
        result.current.settings.map(({ key, word, icon }) => ({ key, word, icon })),
      ).toEqual([
        { key: 'BASE_URL', word: 'in .env', icon: 'file' },
        { key: 'USER_KEY', word: 'project variable', icon: 'lock' },
        { key: 'PROJECT_ID', word: 'missing', icon: 'attention' },
      ]);
    });
  });

  describe('runner', () => {
    it('says the packages are not installed when no Playwright was found', () => {
      useSuiteStore.setState({ suites: { p1: { ...SUITE, version: null } } });

      const { result } = renderHook(() =>
        useSuiteFieldViewModel({ projectId: 'p1', variableNames: [] }),
      );

      expect(result.current).toMatchObject({
        hasPackages: false,
        runner: 'packages not installed',
      });
    });
  });

  describe('onForget', () => {
    it('disconnects the suite and leaves its folder to the QA', () => {
      useSuiteStore.setState({ suites: { p1: SUITE } });

      const { result } = renderHook(() =>
        useSuiteFieldViewModel({ projectId: 'p1', variableNames: [] }),
      );

      act(() => {
        result.current.onForget();
      });

      expect(forgotten).toEqual(['p1']);
      expect(result.current.isConnected).toBe(false);
    });
  });
});
