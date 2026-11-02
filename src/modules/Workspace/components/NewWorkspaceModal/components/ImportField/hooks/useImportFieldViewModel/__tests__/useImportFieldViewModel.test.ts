// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useImportFieldViewModel } from '@/modules/Workspace/components/NewWorkspaceModal/components/ImportField/hooks/useImportFieldViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

const FOLDER = {
  name: 'loja-e2e',
  dir: '/Users/qa/loja-e2e',
  frameworks: [
    { id: 'playwright', files: 3 },
    { id: 'maestro', files: 1 },
  ],
  files: [],
  branch: 'main',
  commit: 'abc123',
};

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useImportFieldViewModel', () => {
  it('hands the folder the QA picked to the workspace', async () => {
    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      pickImport: vi.fn().mockResolvedValue({ kind: 'picked', source: FOLDER }),
    };

    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useImportFieldViewModel({ folder: null, onChange }),
    );

    act(() => {
      result.current.onPick();
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(FOLDER);
    });
  });

  it('keeps what it had when the QA closes the dialog, and says why a folder was refused', async () => {
    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      pickImport: vi.fn().mockResolvedValue({ kind: 'failed', reason: 'empty' }),
    };

    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useImportFieldViewModel({ folder: null, onChange }),
    );

    act(() => {
      result.current.onPick();
    });

    await waitFor(() => {
      expect(result.current.failureText).toBe('That folder has no files to read.');
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('names the folder with what was recognized in it, and lets the QA take it out', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useImportFieldViewModel({ folder: FOLDER, onChange }),
    );

    expect(result.current).toMatchObject({
      hasFolder: true,
      name: 'loja-e2e',
      kinds: 'playwright · maestro',
      path: '/Users/qa/loja-e2e',
    });

    act(() => {
      result.current.onRemove();
    });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('says no framework was recognized instead of showing nothing', () => {
    const { result } = renderHook(() =>
      useImportFieldViewModel({
        folder: { ...FOLDER, frameworks: [] },
        onChange: vi.fn(),
      }),
    );

    expect(result.current.kinds).toBe('framework not recognized');
  });
});
