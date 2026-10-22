// @vitest-environment jsdom
import type { ISuiteWriteModalProps } from '@/modules/Automation/screens/Automation/components/SuiteWriteModal/types';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { suiteTest } from '@/modules/Automation/library/__tests__/fixtures';
import { useSuiteWriteModalViewModel } from '@/modules/Automation/screens/Automation/components/SuiteWriteModal/hooks/useSuiteWriteModalViewModel';

const CASE = {
  workspace: 'Checkout regression',
  id: 'TC-03',
  title: 'Cart survives a reload',
  goal: 'An item stays in the cart.',
  preconditions: '',
  steps: [{ action: 'Reload.', expected: 'The item is there.' }],
};

function render(props: Partial<ISuiteWriteModalProps> = {}) {
  const onWrite = vi.fn();
  const view = renderHook(() =>
    useSuiteWriteModalViewModel({
      folders: [
        {
          path: 'tests/hc-1139',
          name: 'hc-1139',
          files: [
            {
              path: 'tests/hc-1139/a.spec.ts',
              name: 'a.spec.ts',
              tests: [suiteTest({}), suiteTest({})],
            },
          ],
        },
        { path: 'tests/hc-1201', name: 'hc-1201', files: [] },
        { path: '', name: '', files: [] },
      ],
      cases: [
        CASE,
        { ...CASE, workspace: 'Login', id: 'TC-01', title: 'Signs in', goal: '' },
      ],
      canWrite: true,
      note: '',
      onWrite,
      onClose: vi.fn(),
      ...props,
    }),
  );

  return { onWrite, result: view.result };
}

describe('useSuiteWriteModalViewModel', () => {
  describe('onConfirm', () => {
    it("asks the agent with the QA's words, where the suite keeps its like", () => {
      const { result, onWrite } = render();

      expect(result.current.canConfirm).toBe(false);

      act(() => {
        result.current.onText({
          target: { value: '  The cart keeps its items.  ' },
        } as never);
      });
      act(() => {
        result.current.onConfirm();
      });

      expect(onWrite).toHaveBeenCalledWith({
        text: 'The cart keeps its items.',
        folder: '',
        source: null,
      });
    });

    it('asks with a plan case alone, in the folder picked', () => {
      const { result, onWrite } = render();

      act(() => {
        result.current.onPickCase('0');
        result.current.onPickFolder('tests/hc-1139');
      });

      expect(result.current).toMatchObject({
        canConfirm: true,
        source: {
          label: 'TC-03 · Cart survives a reload',
          detail: 'Checkout regression',
        },
        folder: 'tests/hc-1139',
      });

      act(() => {
        result.current.onConfirm();
      });

      expect(onWrite).toHaveBeenCalledWith({
        text: '',
        folder: 'tests/hc-1139',
        source: CASE,
      });
    });

    it('does NOT ask while the agent cannot take it, and says why', () => {
      const { result, onWrite } = render({ canWrite: false, note: 'No git here.' });

      act(() => {
        result.current.onText({ target: { value: 'A test' } } as never);
      });
      act(() => {
        result.current.onConfirm();
      });

      expect(result.current).toMatchObject({ canConfirm: false, hint: 'No git here.' });
      expect(onWrite).not.toHaveBeenCalled();
    });
  });

  describe('the plan cases', () => {
    it('lists each case with its workspace, narrowed by what the QA types', () => {
      const { result } = render();

      act(() => {
        result.current.onCaseQuery('login');
      });

      expect(result.current.caseSearch.items).toEqual([
        { id: '1', label: 'TC-01 · Signs in', tag: 'Login', detail: null },
      ]);
    });

    it('takes a case out again', () => {
      const { result } = render();

      act(() => {
        result.current.onPickCase('0');
      });
      act(() => {
        result.current.onClearSource();
      });

      expect(result.current.source).toBeNull();
    });

    it('says when no workspace has a plan', () => {
      expect(render({ cases: [] }).result.current.noCases).toBe(
        'No workspace of this project has a plan yet.',
      );
    });
  });

  describe('the folders', () => {
    it('lists the suite folders with how many tests each holds, the root left out', () => {
      expect(render().result.current.folderSearch.items).toEqual([
        { id: 'tests/hc-1139', label: 'tests/hc-1139', tag: '2 tests', detail: null },
        { id: 'tests/hc-1201', label: 'tests/hc-1201', tag: '0 tests', detail: null },
      ]);
    });
  });
});
