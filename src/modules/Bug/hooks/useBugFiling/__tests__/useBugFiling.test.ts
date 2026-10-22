// @vitest-environment jsdom
import type { IFileBug, IFilingEvent } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useBugFiling } from '@/modules/Bug/hooks/useBugFiling';
import { filingPlanOf } from '@/modules/Bug/library';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const WORKSPACE = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });
const BUG = WORKSPACE.bugs[0]!;
const TARGET = { tracker: 'jira' as const, project: 'SHOP' };
const PLAN = filingPlanOf({ workspace: WORKSPACE, bug: BUG, tracker: 'jira' });

let tell: (event: IFilingEvent) => void = () => undefined;
let finish: (filed: boolean) => void = () => undefined;
let asked: IFileBug[] = [];

beforeEach(() => {
  asked = [];
  useWorkspaceStore.setState({ workspaces: [WORKSPACE] });
  useAppStore.setState({ projects: [] });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    onFilingEvent: (listener) => {
      tell = listener;

      return () => {
        tell = () => undefined;
      };
    },
    fileBug: (request) => {
      asked.push(request);

      return new Promise((settle) => {
        finish = (filed) => {
          settle(
            filed
              ? {
                  isFiled: true,
                  issue: {
                    tracker: 'jira',
                    key: 'SHOP-57',
                    url: 'https://j/SHOP-57',
                    at: '',
                  },
                  missed: [],
                  linked: null,
                }
              : { isFiled: false, failure: 'rejected', said: 'Nope.' },
          );
        };
      });
    },
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

const states = (filing: { steps: { state: string }[] } | null) =>
  filing?.steps.map(({ state }) => state);

describe('useBugFiling', () => {
  describe('start', () => {
    it('lists the steps the bug goes through, and moves each as main tells it', async () => {
      const { result } = renderHook(() => useBugFiling());

      act(() => {
        result.current.start({
          workspaceId: WORKSPACE.id,
          bugId: BUG.id,
          target: TARGET,
          title: BUG.title,
          plan: PLAN,
        });
      });

      expect(result.current.filing?.steps.map(({ row }) => row)).toEqual([
        'ready',
        'issue',
        'screens',
      ]);
      expect(states(result.current.filing)).toEqual(['working', 'pending', 'pending']);

      await waitFor(() => {
        expect(asked).toHaveLength(1);
      });

      expect(states(result.current.filing)).toEqual(['done', 'pending', 'pending']);

      act(() => {
        tell({ filingId: asked[0]!.filingId, step: 'issue', state: 'done' });
        tell({ filingId: 'f-other', step: 'screens', state: 'done' });
      });

      expect(states(result.current.filing)).toEqual(['done', 'done', 'pending']);

      await act(async () => {
        finish(true);
        await Promise.resolve();
      });

      expect(result.current.filing?.result).toMatchObject({ isFiled: true });
    });

    it('sends it again as it was asked, and forgets it once closed', async () => {
      const { result } = renderHook(() => useBugFiling());

      act(() => {
        result.current.start({
          workspaceId: WORKSPACE.id,
          bugId: BUG.id,
          target: TARGET,
          title: 'Typed title',
          plan: PLAN,
        });
      });
      await waitFor(() => {
        expect(asked).toHaveLength(1);
      });
      await act(async () => {
        finish(false);
        await Promise.resolve();
      });

      expect(result.current.filing?.result).toMatchObject({ failure: 'rejected' });

      act(() => {
        result.current.retry();
      });
      await waitFor(() => {
        expect(asked).toHaveLength(2);
      });

      expect(asked[1]?.report.title).toBe('Typed title');
      expect(asked[1]?.filingId).not.toBe(asked[0]?.filingId);

      act(() => {
        result.current.close();
      });

      expect(result.current.filing).toBeNull();
    });

    /** A main process started before the filer existed has no channel for it: the popup must end, not wait forever. */
    it('ends in a failure, with what went wrong, when the bridge throws', async () => {
      window.qazinho.fileBug = () =>
        Promise.reject(new Error("No handler registered for 'bug:file'"));

      const { result } = renderHook(() => useBugFiling());

      act(() => {
        result.current.start({
          workspaceId: WORKSPACE.id,
          bugId: BUG.id,
          target: TARGET,
          title: BUG.title,
          plan: PLAN,
        });
      });

      await waitFor(() => {
        expect(result.current.filing?.result).toEqual({
          isFiled: false,
          failure: 'unexpected',
          said: "No handler registered for 'bug:file'",
        });
      });
      expect(result.current.filing?.steps.map(({ state }) => state)).toEqual([
        'done',
        'failed',
        'pending',
      ]);
    });
  });
});
