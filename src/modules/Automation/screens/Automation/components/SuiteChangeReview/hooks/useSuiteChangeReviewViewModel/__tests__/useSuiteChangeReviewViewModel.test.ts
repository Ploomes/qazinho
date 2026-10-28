// @vitest-environment jsdom
import type { ISuiteChange, SuiteShipOutcome, SuiteShipWay } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { suiteResult, suiteTest } from '@/modules/Automation/library/__tests__/fixtures';
import { useSuiteChangeReviewViewModel } from '@/modules/Automation/screens/Automation/components/SuiteChangeReview/hooks/useSuiteChangeReviewViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

const CHANGE: ISuiteChange = {
  id: 'c-01',
  projectId: 'p-1',
  ask: {
    kind: 'fix',
    runId: 's-03',
    test: suiteTest({ title: 'CT-NAV-002 · Abre o carrinho' }),
  },
  startedAt: 1,
  endedAt: 2,
  status: 'ready',
  step: null,
  branch: 'qazinho/fix-ct-nav-002',
  base: 'main',
  commit: 'c0ffee1234567',
  summary: 'The link is "Carrinho" now.',
  message: {
    commit: 'fix(hc-1): find the cart',
    title: 'CT-NAV-002: find the cart',
    body: 'The menu link was renamed.',
  },
  files: [
    { path: 'a.spec.ts', status: 'modified', additions: 1, deletions: 1, patch: '' },
    { path: 'b.page.ts', status: 'added', additions: 3, deletions: 0, patch: '' },
  ],
  checks: [suiteResult({})],
  failure: null,
  shipped: null,
};

let shipped: { way: SuiteShipWay }[] = [];
let discarded: string[] = [];
let outcome: SuiteShipOutcome = { isOk: true, change: { ...CHANGE, status: 'shipped' } };

beforeEach(() => {
  shipped = [];
  discarded = [];
  outcome = { isOk: true, change: { ...CHANGE, status: 'shipped' } };
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    shipSuiteChange: (props) => {
      shipped.push({ way: props.way });

      return Promise.resolve(outcome);
    },
    discardSuiteChange: (props) => {
      discarded.push(props.changeId);

      return Promise.resolve({ ...CHANGE, status: 'discarded' });
    },
  };
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

function render(props: { canOpenPullRequest?: boolean } = {}) {
  const onClose = vi.fn();
  const view = renderHook(() =>
    useSuiteChangeReviewViewModel({
      change: CHANGE,
      canOpenPullRequest: props.canOpenPullRequest ?? true,
      onClose,
    }),
  );

  return { onClose, result: view.result };
}

describe('useSuiteChangeReviewViewModel', () => {
  it("shows the agent's words, its run of the test, the pull request it wrote and every file, the first open", () => {
    expect(render().result.current).toMatchObject({
      subtitle:
        'What the agent changed for CT-NAV-002 · Abre o carrinho. Nothing leaves your machine until you send it.',
      branch: 'qazinho/fix-ct-nav-002',
      from: 'from main · c0ffee1',
      summary: 'The link is "Carrinho" now.',
      check: { icon: 'passed', text: 'The test passes in the copy' },
      pullRequest: {
        title: 'CT-NAV-002: find the cart',
        body: 'The menu link was renamed.',
      },
      files: [
        { key: 'a.spec.ts', isOpenAtFirst: true },
        { key: 'b.page.ts', isOpenAtFirst: false },
      ],
    });
  });

  describe('onConfirm', () => {
    it('opens the pull request when GitHub can, and closes once it is open', async () => {
      const { result, onClose } = render();

      expect(result.current.confirmLabel).toBe('Open the pull request');

      act(() => {
        result.current.onConfirm();
      });

      expect(result.current).toMatchObject({ canConfirm: false, hint: 'Sending…' });
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledOnce();
      });
      expect(shipped).toEqual([{ way: 'pull-request' }]);
    });

    it('sends the branch alone when GitHub cannot open the pull request', () => {
      const { result } = render({ canOpenPullRequest: false });

      expect(result.current.confirmLabel).toBe('Send the branch');

      act(() => {
        result.current.onConfirm();
      });

      expect(shipped).toEqual([{ way: 'branch' }]);
    });

    it('says why git did not send it, and lets the QA try again', async () => {
      outcome = {
        isOk: false,
        step: 'push',
        said: 'Permission denied (publickey).',
        change: CHANGE,
      };

      const { result, onClose } = render();

      act(() => {
        result.current.onConfirm();
      });

      await waitFor(() => {
        expect(result.current.hint).toBe(
          'Git could not send the branch: Permission denied (publickey).',
        );
      });
      expect(result.current.canConfirm).toBe(true);
      expect(onClose).not.toHaveBeenCalled();
    });

    /** A branch já saiu da máquina: mandá-la de novo falharia, então só resta fechar. */
    it('does NOT send again once the branch went and only the pull request failed', async () => {
      outcome = {
        isOk: false,
        step: 'pull-request',
        said: 'Validation Failed',
        change: { ...CHANGE, status: 'shipped' },
      };

      const { result } = render();

      act(() => {
        result.current.onConfirm();
      });

      await waitFor(() => {
        expect(result.current.hint).toBe(
          'The branch was sent, but GitHub did not open the pull request: Validation Failed',
        );
      });
      expect(result.current).toMatchObject({ canConfirm: false, canDiscard: false });
    });
  });

  describe('onDiscard', () => {
    it('throws the change away and closes', async () => {
      const { result, onClose } = render();

      act(() => {
        result.current.onDiscard();
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledOnce();
      });
      expect(discarded).toEqual(['c-01']);
    });
  });
});
