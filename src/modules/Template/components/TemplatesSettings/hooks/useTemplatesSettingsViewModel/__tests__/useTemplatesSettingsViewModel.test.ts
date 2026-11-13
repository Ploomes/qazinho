// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTemplatesSettingsViewModel } from '@/modules/Template/components/TemplatesSettings/hooks';
import { useTemplateStore } from '@/store';

const PLAN = {
  id: 't-plan',
  kind: 'plan' as const,
  name: 'Plano do time',
  title: '',
  parts: [{ kind: 'section' as const, field: 'cases', heading: 'Cenários' }],
  cases: 'gherkin' as const,
  updatedAt: '',
};

beforeEach(() => {
  useTemplateStore.setState({ templates: [PLAN] });
});

describe('useTemplatesSettingsViewModel', () => {
  it('lists the templates under what each lays out, with its parts and format', () => {
    const { result } = renderHook(() => useTemplatesSettingsViewModel());

    expect(
      result.current.sections.map(({ title, rows }) => [title, rows.length]),
    ).toEqual([
      ['Bug', 0],
      ['Plan page', 1],
      ['Doubts comment', 0],
      ['Decisions comment', 0],
    ]);
    expect(result.current.sections[1]?.rows[0]).toMatchObject({
      name: 'Plano do time',
      facts: '1 part · cases in Gherkin',
    });
  });

  it('opens a template to edit, or a new one, and closes', () => {
    const { result } = renderHook(() => useTemplatesSettingsViewModel());

    act(() => {
      result.current.sections[1]?.rows[0]?.onOpen();
    });

    expect(result.current).toMatchObject({ isEditing: true, editorKey: 't-plan' });
    expect(result.current.editing?.id).toBe('t-plan');

    act(() => {
      result.current.onNew();
    });

    expect(result.current).toMatchObject({
      isEditing: true,
      editing: null,
      editorKey: 'new',
    });

    act(() => {
      result.current.onClose();
    });

    expect(result.current.isEditing).toBe(false);
  });
});
