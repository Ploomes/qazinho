// @vitest-environment jsdom
import type { IVariableDraft } from '@/modules/Project/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useVariableFieldViewModel } from '@/modules/Project/components/ProjectModal/components/VariableField/hooks/useVariableFieldViewModel';

const SAVED = [{ name: 'LOGIN_EMAIL', description: 'The admin' }];
const KEPT: IVariableDraft = {
  key: 'saved-LOGIN_EMAIL',
  name: 'LOGIN_EMAIL',
  description: 'The admin',
  value: '',
  from: 'LOGIN_EMAIL',
};

function field(variables: IVariableDraft[] = [KEPT]) {
  const onChange = vi.fn();
  const { result, rerender } = renderHook(
    (props: { variables: IVariableDraft[] }) =>
      useVariableFieldViewModel({ variables: props.variables, saved: SAVED, onChange }),
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
      expect(JSON.stringify(result.current.rows)).not.toContain('value');
    });

    it('tags a variable not saved yet as new, and one edited since as changed', () => {
      const { result } = field([
        { ...KEPT, value: 'new password' },
        { key: 'new-0', name: 'TOKEN', description: '', value: 'abc', from: null },
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
        { key: 'new-0', name: 'API_TOKEN', description: '', value: 's3cret', from: null },
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
