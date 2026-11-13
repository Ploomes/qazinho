// @vitest-environment jsdom
import type { ISaveTemplate, ITemplate } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTemplateEditorViewModel } from '@/modules/Template/components/TemplateEditor/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useTemplateStore } from '@/store';

const SAVED: ITemplate = {
  id: 't-1',
  kind: 'bug',
  name: 'Bug do time',
  title: '[{{case}}] {{title}}',
  parts: [
    { kind: 'section', field: 'steps', heading: 'Como reproduzir' },
    { kind: 'text', text: 'Ambiente: {{app}}' },
  ],
  cases: 'steps',
  updatedAt: '',
};

function bridge() {
  const save = vi.fn((template: ISaveTemplate) =>
    Promise.resolve({
      isSaved: true as const,
      template: { ...template, id: template.id ?? 't-9', updatedAt: '2026-11-13' },
    }),
  );
  const remove = vi.fn(() => Promise.resolve(true));

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    saveTemplate: save,
    removeTemplate: remove,
  };

  return { save, remove };
}

beforeEach(() => {
  useTemplateStore.setState({ templates: [SAVED] });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useTemplateEditorViewModel', () => {
  it('starts a new bug template with every section, under QAzinho’s headings', () => {
    bridge();

    const { result } = renderHook(() =>
      useTemplateEditorViewModel({ editing: null, onClose: vi.fn() }),
    );

    expect(result.current.isNew).toBe(true);
    expect(result.current.parts.map(({ value }) => value)).toEqual([
      'What the agent saw',
      'Steps to reproduce',
      'Expected',
      'What happened',
      'Requests that failed',
      'Where it was caught',
      'Attached files',
      'The QAzinho line',
    ]);
    expect(result.current.addable).toEqual([]);
  });

  it('shows the structure it lays out, each section and field as a marker', () => {
    bridge();

    const { result } = renderHook(() =>
      useTemplateEditorViewModel({ editing: SAVED, onClose: vi.fn() }),
    );

    expect(result.current.previewTitle).toBe('[‹case›] ‹title›');
    expect(result.current.preview).toEqual([
      { kind: 'heading', text: 'Como reproduzir' },
      { kind: 'paragraph', text: '‹Steps to reproduce›' },
      { kind: 'paragraph', text: 'Ambiente: ‹app›' },
    ]);
  });

  it('moves, edits, removes and adds parts', () => {
    bridge();

    const { result } = renderHook(() =>
      useTemplateEditorViewModel({ editing: SAVED, onClose: vi.fn() }),
    );

    act(() => {
      result.current.onMove({ index: 1, by: -1 });
    });
    act(() => {
      result.current.onValue({ index: 0, value: 'Severidade: Alta' });
    });
    act(() => {
      result.current.onRemove(1);
    });
    act(() => {
      result.current.onAddSection('expected');
    });

    expect(
      result.current.parts.map(({ isSection, value }) => `${String(isSection)} ${value}`),
    ).toEqual(['false Severidade: Alta', 'true Expected']);
  });

  it('starts over with the sections of another kind when the QA picks it', () => {
    bridge();

    const { result } = renderHook(() =>
      useTemplateEditorViewModel({ editing: null, onClose: vi.fn() }),
    );

    act(() => {
      result.current.onKind('doubts');
    });

    expect(result.current).toMatchObject({
      kind: 'doubts',
      hasTitle: false,
      hasCases: false,
    });
    expect(result.current.parts.map(({ label }) => label)).toEqual([
      'Heading of The doubts',
    ]);
  });

  it('saves the template, lands it in the store and closes', async () => {
    const { save } = bridge();
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useTemplateEditorViewModel({ editing: null, onClose }),
    );

    act(() => {
      result.current.onName('Nosso bug');
    });
    act(() => {
      result.current.onConfirm();
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(save.mock.calls[0]?.[0]).toMatchObject({
      id: null,
      kind: 'bug',
      name: 'Nosso bug',
    });
    expect(useTemplateStore.getState().templates.map(({ id }) => id)).toEqual([
      't-1',
      't-9',
    ]);
  });

  it('does NOT save a template with no name, and deletes one being edited', async () => {
    const { save, remove } = bridge();
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useTemplateEditorViewModel({ editing: SAVED, onClose }),
    );

    act(() => {
      result.current.onName('  ');
    });
    act(() => {
      result.current.onConfirm();
    });

    expect(result.current.canConfirm).toBe(false);
    expect(save).not.toHaveBeenCalled();

    act(() => {
      result.current.onDelete();
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(remove).toHaveBeenCalledWith('t-1');
    expect(useTemplateStore.getState().templates).toEqual([]);
  });
});
