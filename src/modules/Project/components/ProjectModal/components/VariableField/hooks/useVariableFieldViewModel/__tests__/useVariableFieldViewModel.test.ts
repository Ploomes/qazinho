// @vitest-environment jsdom
import type { IVariableDraft } from '@/modules/Project/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useVariableFieldViewModel } from '@/modules/Project/components/ProjectModal/components/VariableField/hooks/useVariableFieldViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

const SAVED = [{ name: 'LOGIN_EMAIL', description: 'The admin' }];
const KEPT: IVariableDraft = {
  key: 'saved-LOGIN_EMAIL',
  name: 'LOGIN_EMAIL',
  description: 'The admin',
  value: '',
  from: 'LOGIN_EMAIL',
  isSecret: true,
};

function field(variables: IVariableDraft[] = [KEPT]) {
  const onChange = vi.fn();
  const { result, rerender } = renderHook(
    (props: { variables: IVariableDraft[] }) =>
      useVariableFieldViewModel({
        projectId: 'p1',
        variables: props.variables,
        saved: SAVED,
        onChange,
      }),
    { initialProps: { variables } },
  );

  return { result, rerender, onChange };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
});

describe('useVariableFieldViewModel', () => {
  describe('rows', () => {
    it('lists each variable by name and what it holds, its value never', () => {
      const { result } = field();

      expect(result.current.rows).toEqual([
        expect.objectContaining({
          key: 'saved-LOGIN_EMAIL',
          name: 'LOGIN_EMAIL',
          description: 'The admin',
          tag: '',
          isEditing: false,
        }),
      ]);
      expect(result.current.rows[0]).toMatchObject({ isSecret: true, shownValue: null });
    });

    it('tags a variable not saved yet as new, and one edited since as changed', () => {
      const { result } = field([
        { ...KEPT, value: 'new password' },
        {
          key: 'new-0',
          name: 'TOKEN',
          description: '',
          value: 'abc',
          from: null,
          isSecret: null,
        },
      ]);

      expect(result.current.rows.map(({ tag }) => tag)).toEqual(['changed', 'new']);
    });

    it('says there are none yet, until one is added', () => {
      expect(field([]).result.current.isEmpty).toBe(true);
    });
  });

  describe('onAdd and onDone', () => {
    it('adds a variable once it has a name and a value', () => {
      const { result, onChange } = field();

      act(() => {
        result.current.onAdd();
      });

      expect(result.current.isAdding).toBe(true);
      expect(result.current.editor?.canFinish).toBe(false);
      expect(result.current.editor?.problem).toBe('Give each variable a name.');

      act(() => {
        result.current.editor?.onName('api token');
        result.current.editor?.onValue('s3cret');
      });
      act(() => {
        result.current.onDone();
      });

      expect(onChange).toHaveBeenCalledWith([
        KEPT,
        {
          key: 'new-0',
          name: 'API_TOKEN',
          description: '',
          value: 's3cret',
          from: null,
          isSecret: null,
        },
      ]);
      expect(result.current.editor).toBeNull();
    });

    it('does NOT add a variable whose name the project already keeps', () => {
      const { result, onChange } = field();

      act(() => {
        result.current.onAdd();
      });
      act(() => {
        result.current.editor?.onName('LOGIN_EMAIL');
        result.current.editor?.onValue('x');
      });
      act(() => {
        result.current.onDone();
      });

      expect(result.current.editor?.problem).toBe(
        'Two variables are called LOGIN_EMAIL.',
      );
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('onEdit', () => {
    it('opens a saved variable in place, keeping its value unless a new one is typed', () => {
      const { result, onChange } = field();

      act(() => {
        result.current.onEdit('saved-LOGIN_EMAIL');
      });

      expect(result.current.rows[0]?.isEditing).toBe(true);
      expect(result.current.editor?.valuePlaceholder).toBe('Keep the value it has');
      expect(result.current.editor?.canFinish).toBe(true);

      act(() => {
        result.current.editor?.onDescription('The owner');
      });
      act(() => {
        result.current.onDone();
      });

      expect(onChange).toHaveBeenCalledWith([{ ...KEPT, description: 'The owner' }]);
    });

    it('does NOT keep what was typed when the QA cancels', () => {
      const { result, onChange } = field();

      act(() => {
        result.current.onEdit('saved-LOGIN_EMAIL');
      });
      act(() => {
        result.current.editor?.onValue('typed then dropped');
        result.current.onCancelEdit();
      });

      expect(result.current.editor).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('onRemove', () => {
    it('takes the variable out of the list', () => {
      const { result, onChange } = field();

      act(() => {
        result.current.onRemove('saved-LOGIN_EMAIL');
      });

      expect(onChange).toHaveBeenCalledWith([]);
    });
  });
});

describe('useVariableFieldViewModel, a value that is no secret', () => {
  const PLAIN: IVariableDraft = { ...KEPT, isSecret: false };

  it('shows the value of a saved one only when the QA asks, from the vault', async () => {
    const reveal = vi.fn(() => Promise.resolve('qa@shop.test'));

    window.qazinho = { ...fakeQazinhoApi('darwin'), revealVariable: reveal };

    const { result } = field([PLAIN]);

    expect(result.current.rows[0]).toMatchObject({ isSecret: false, shownValue: null });

    act(() => {
      result.current.onReveal(PLAIN.key);
    });

    await waitFor(() => {
      expect(result.current.rows[0]?.shownValue).toBe('qa@shop.test');
    });
    expect(reveal).toHaveBeenCalledWith({ projectId: 'p1', name: 'LOGIN_EMAIL' });

    act(() => {
      result.current.onReveal(PLAIN.key);
    });

    expect(result.current.rows[0]?.shownValue).toBeNull();
  });

  it('shows a value typed but not saved yet without asking the vault', () => {
    const reveal = vi.fn(() => Promise.resolve(null));

    window.qazinho = { ...fakeQazinhoApi('darwin'), revealVariable: reveal };

    const { result } = field([{ ...PLAIN, value: 'new@shop.test' }]);

    act(() => {
      result.current.onReveal(PLAIN.key);
    });

    expect(result.current.rows[0]?.shownValue).toBe('new@shop.test');
    expect(reveal).not.toHaveBeenCalled();
  });

  it('never shows a secret, even when asked', () => {
    const reveal = vi.fn(() => Promise.resolve('Sup3r!'));

    window.qazinho = { ...fakeQazinhoApi('darwin'), revealVariable: reveal };

    const { result } = field([{ ...KEPT, value: 'Sup3r!' }]);

    act(() => {
      result.current.onReveal(KEPT.key);
    });

    expect(result.current.rows[0]?.shownValue).toBeNull();
    expect(reveal).not.toHaveBeenCalled();
  });

  it('makes a new variable named like an email no secret, until the QA says it is one', () => {
    const { result } = field([]);

    act(() => {
      result.current.onAdd();
    });
    act(() => {
      result.current.editor?.onName('crm_email');
    });

    expect(result.current.editor?.isSecret).toBe(false);

    act(() => {
      result.current.editor?.onSecret(true);
    });

    expect(result.current.editor?.isSecret).toBe(true);
  });
});
