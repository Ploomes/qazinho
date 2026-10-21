// @vitest-environment jsdom
import type { IApplyVariables, VariablesOutcome } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useVariablesModalViewModel } from '@/modules/Project/components/VariablesModal/hooks/useVariablesModalViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useVariablesStore } from '@/store';

const DRAFTS = [
  { name: 'login email', description: 'The admin on staging' },
  { name: 'LOGIN_PASSWORD', description: 'Its password' },
];

/** A bridge whose vault keeps what it was asked and answers with `outcome`. */
function vault(outcome?: VariablesOutcome) {
  const applied: IApplyVariables[] = [];

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    applyVariables: (apply) => {
      applied.push(apply);

      return Promise.resolve(
        outcome ?? {
          isSaved: true,
          variables: apply.changes.flatMap((change) =>
            change.kind === 'save'
              ? [{ name: change.name, description: change.description }]
              : [],
          ),
        },
      );
    },
  };

  return applied;
}

function opened() {
  return renderHook(() => useVariablesModalViewModel()).result;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  useAppStore.setState({
    projects: [{ id: 'p1', name: 'Shop', targets: [], repositories: [] }],
  });
  useVariablesStore.setState({
    byProject: { p1: [{ name: 'LOGIN_PASSWORD', description: 'Old' }] },
    request: { id: 'v-1', projectId: 'p1', drafts: DRAFTS },
    settled: null,
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useVariablesModalViewModel', () => {
  describe('what it shows', () => {
    it("opens on the agent's drafts, each name made a variable's, and every value empty", () => {
      const result = opened();

      expect(result.current.project).toBe('Shop');
      expect(result.current.rows.map(({ name, value }) => [name, value])).toEqual([
        ['LOGIN_EMAIL', ''],
        ['LOGIN_PASSWORD', ''],
      ]);
    });

    it('says when a value replaces one the project keeps', () => {
      expect(opened().current.rows.map(({ note }) => note)).toEqual([
        '',
        'Replaces the value LOGIN_PASSWORD keeps',
      ]);
    });

    it('does NOT save until every value is typed, and says which one is missing', () => {
      const result = opened();

      expect(result.current.canConfirm).toBe(false);
      expect(result.current.hint).toBe('Type the value of LOGIN_EMAIL.');
    });
  });

  describe('onName', () => {
    it('writes what the QA types as a variable name', () => {
      const result = opened();

      act(() => {
        result.current.rows[0]?.onName('admin e-mail');
      });

      expect(result.current.rows[0]?.name).toBe('ADMIN_E_MAIL');
    });
  });

  describe('onConfirm', () => {
    it('seals every value, closes, and answers with the names kept', async () => {
      const applied = vault();
      const result = opened();

      act(() => {
        result.current.rows[0]?.onValue('qa@shop.test');
        result.current.rows[1]?.onValue('Sup3r $& s3cret');
      });
      act(() => {
        result.current.onConfirm();
      });

      await waitFor(() => {
        expect(useVariablesStore.getState().settled).toEqual({
          id: 'v-1',
          saved: ['LOGIN_EMAIL', 'LOGIN_PASSWORD'],
        });
      });
      expect(applied[0]?.changes).toEqual([
        {
          kind: 'save',
          name: 'LOGIN_EMAIL',
          description: 'The admin on staging',
          value: 'qa@shop.test',
          from: null,
        },
        {
          kind: 'save',
          name: 'LOGIN_PASSWORD',
          description: 'Its password',
          value: 'Sup3r $& s3cret',
          from: null,
        },
      ]);
      expect(useVariablesStore.getState().request).toBeNull();
    });

    it('does NOT close when the machine has no keychain, and says why', async () => {
      vault({ isSaved: false, failure: { reason: 'no-keychain' } });

      const result = opened();

      act(() => {
        result.current.rows[0]?.onValue('a');
        result.current.rows[1]?.onValue('b');
      });
      act(() => {
        result.current.onConfirm();
      });

      await waitFor(() => {
        expect(result.current.hint).toContain('no keychain');
      });
      expect(useVariablesStore.getState().request?.id).toBe('v-1');
      expect(result.current.canConfirm).toBe(true);
    });
  });

  describe('onCancel', () => {
    it('closes and answers that nothing was kept', () => {
      const result = opened();

      act(() => {
        result.current.onCancel();
      });

      expect(useVariablesStore.getState().settled).toEqual({ id: 'v-1', saved: null });
    });
  });
});
