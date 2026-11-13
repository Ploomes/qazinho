// @vitest-environment jsdom
import type {
  IOrgTemplate,
  IOrgTemplateDefault,
  ISaveOrgTemplate,
  ISaveTemplate,
  ITemplate,
} from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTemplateEditorViewModel } from '@/modules/Template/components/TemplateEditor/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useProStore, useTemplateStore } from '@/store';

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

const ORG_BUG: IOrgTemplate = {
  ...SAVED,
  id: 'org:loja:a1',
  name: 'Bug da org',
  orgSlug: 'loja',
  isDefault: false,
  author: 'Ana',
};

/** Uma org em que o QA publica e escolhe o padrão, ou só lê. */
function orgOf(role: { canPublish: boolean; canSetDefault: boolean }) {
  return { orgSlug: 'loja', templates: [ORG_BUG], ...role };
}

/** A bridge de uma org que guarda o que recebe, e devolve a lista de novo. */
function orgBridge() {
  const saveOrg = vi.fn((save: ISaveOrgTemplate) =>
    Promise.resolve({
      isSaved: true as const,
      template: {
        ...save.template,
        id: save.template.id ?? 'org:loja:a2',
        updatedAt: '2026-11-13',
        orgSlug: save.orgSlug,
        isDefault: false,
        author: 'Ana',
      },
    }),
  );
  const setDefault = vi.fn((_choice: IOrgTemplateDefault) =>
    Promise.resolve({ isDone: true as const }),
  );
  const listOrg = vi.fn(() =>
    Promise.resolve({
      isListed: true as const,
      list: orgOf({ canPublish: true, canSetDefault: true }),
    }),
  );
  const save = vi.fn(() => Promise.resolve({ isSaved: true as const, template: SAVED }));

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    saveTemplate: save,
    saveOrgTemplate: saveOrg,
    setOrgTemplateDefault: setDefault,
    listOrgTemplates: listOrg,
  };

  return { save, saveOrg, setDefault, listOrg };
}

beforeEach(() => {
  useTemplateStore.setState({ templates: [SAVED], orgTemplates: [] });
  useProStore.setState({ status: null });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useTemplateEditorViewModel', () => {
  it('starts a new bug template with every section, under QAzinho’s headings', () => {
    bridge();

    const { result } = renderHook(() =>
      useTemplateEditorViewModel({ editing: null, orgSlug: null, onClose: vi.fn() }),
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
      useTemplateEditorViewModel({ editing: SAVED, orgSlug: null, onClose: vi.fn() }),
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
      useTemplateEditorViewModel({ editing: SAVED, orgSlug: null, onClose: vi.fn() }),
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
      useTemplateEditorViewModel({ editing: null, orgSlug: null, onClose: vi.fn() }),
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
      useTemplateEditorViewModel({ editing: null, orgSlug: null, onClose }),
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
      useTemplateEditorViewModel({ editing: SAVED, orgSlug: null, onClose }),
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

  it('offers the orgs the QA publishes in, by name, only for a new template', () => {
    bridge();
    useTemplateStore.setState({
      orgTemplates: [
        orgOf({ canPublish: true, canSetDefault: false }),
        { ...orgOf({ canPublish: false, canSetDefault: false }), orgSlug: 'outra' },
      ],
    });
    useProStore.setState({
      status: {
        isSignedIn: true,
        account: { email: 'ana@loja.dev', name: 'Ana' },
        machine: { id: 'm1', name: 'Mac' },
        orgs: [
          { slug: 'loja', name: 'Loja Online', role: 'editor', billingStatus: 'active' },
        ],
        isReachable: true,
      },
    });

    const fresh = renderHook(() =>
      useTemplateEditorViewModel({ editing: null, orgSlug: null, onClose: vi.fn() }),
    );
    const open = renderHook(() =>
      useTemplateEditorViewModel({ editing: SAVED, orgSlug: null, onClose: vi.fn() }),
    );

    expect(fresh.result.current.places).toEqual([
      { id: 'mine', label: 'This computer' },
      { id: 'loja', label: 'Loja Online' },
    ]);
    expect(fresh.result.current.hasPlaces).toBe(true);
    expect(open.result.current.hasPlaces).toBe(false);
  });

  it('publishes a new template in the org and makes it the default there', async () => {
    const { save, saveOrg, setDefault, listOrg } = orgBridge();
    const onClose = vi.fn();
    useTemplateStore.setState({
      orgTemplates: [orgOf({ canPublish: true, canSetDefault: true })],
    });
    const { result } = renderHook(() =>
      useTemplateEditorViewModel({ editing: null, orgSlug: null, onClose }),
    );

    act(() => {
      result.current.onPlace('loja');
    });
    act(() => {
      result.current.onName('Nosso bug');
      result.current.onDefault(true);
    });
    act(() => {
      result.current.onConfirm();
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(save).not.toHaveBeenCalled();
    expect(saveOrg).toHaveBeenCalledWith(
      expect.objectContaining({
        orgSlug: 'loja',
        template: expect.objectContaining({ id: null, name: 'Nosso bug' }),
      }),
    );
    expect(setDefault).toHaveBeenCalledWith({
      orgSlug: 'loja',
      kind: 'bug',
      id: 'org:loja:a2',
    });
    expect(listOrg).toHaveBeenCalledWith('loja');
  });

  it('does NOT offer the default to an editor, nor change it', async () => {
    const { setDefault } = orgBridge();
    const onClose = vi.fn();
    useTemplateStore.setState({
      orgTemplates: [orgOf({ canPublish: true, canSetDefault: false })],
    });
    const { result } = renderHook(() =>
      useTemplateEditorViewModel({ editing: ORG_BUG, orgSlug: 'loja', onClose }),
    );

    expect(result.current.hasDefault).toBe(false);

    act(() => {
      result.current.onConfirm();
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(setDefault).not.toHaveBeenCalled();
  });

  it('lets a reader keep a copy of an org template, never change the org’s', async () => {
    const { save, saveOrg } = orgBridge();
    const onClose = vi.fn();
    useTemplateStore.setState({
      orgTemplates: [orgOf({ canPublish: false, canSetDefault: false })],
    });
    const { result } = renderHook(() =>
      useTemplateEditorViewModel({ editing: ORG_BUG, orgSlug: 'loja', onClose }),
    );

    expect(result.current).toMatchObject({
      confirmLabel: 'Save a copy',
      hint: 'Only editors change the org’s templates.',
      canDelete: false,
    });

    act(() => {
      result.current.onConfirm();
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(saveOrg).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ id: null, name: 'Bug da org' }),
    );
  });

  it('says why the org refused, and stays open', async () => {
    orgBridge();
    window.qazinho = {
      ...window.qazinho,
      saveOrgTemplate: () => Promise.resolve({ isSaved: false, failure: 'forbidden' }),
    };
    const onClose = vi.fn();
    useTemplateStore.setState({
      orgTemplates: [orgOf({ canPublish: true, canSetDefault: false })],
    });
    const { result } = renderHook(() =>
      useTemplateEditorViewModel({ editing: ORG_BUG, orgSlug: 'loja', onClose }),
    );

    act(() => {
      result.current.onConfirm();
    });

    await waitFor(() => {
      expect(result.current.hint).toBe('Your role in the org does not allow this.');
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
