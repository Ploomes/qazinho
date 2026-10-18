// @vitest-environment jsdom
import type { SaveOutcome } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useLightboxViewModel } from '@/shared/components/organisms/Lightbox/hooks/useLightboxViewModel';
import { useAppStore } from '@/store';

const SHOT = {
  kicker: 'run r-01',
  title: 'the step that broke',
  isTall: false,
  src: 'data:image/jpeg;base64,shot',
  file: null,
};

function saving(outcome: SaveOutcome) {
  const saveShot = vi.fn(() => Promise.resolve(outcome));

  window.qazinho = { ...fakeQazinhoApi('darwin'), saveShot };

  return saveShot;
}

beforeEach(() => {
  useAppStore.setState({ media: SHOT });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useLightboxViewModel', () => {
  it('shows what was opened', () => {
    const { result } = renderHook(() => useLightboxViewModel());

    expect(result.current.media?.title).toBe('the step that broke');
  });

  it('frames a phone narrower than a browser', () => {
    const wide = renderHook(() => useLightboxViewModel());

    expect(wide.result.current.frameWidth).toBe(560);

    useAppStore.setState({ media: { ...SHOT, isTall: true, src: null, file: null } });

    const tall = renderHook(() => useLightboxViewModel());

    expect(tall.result.current.frameWidth).toBe(320);
  });

  describe('onSave', () => {
    it('saves what is on screen where the QA picks, under a name they can read', async () => {
      const saveShot = saving('saved');
      const { result } = renderHook(() => useLightboxViewModel());

      expect(result.current).toMatchObject({ canSave: true, saveLabel: 'Download' });

      act(() => {
        result.current.onSave();
      });

      expect(result.current).toMatchObject({ isSaving: true, saveLabel: 'Saving…' });
      expect(saveShot).toHaveBeenCalledWith({
        file: null,
        src: 'data:image/jpeg;base64,shot',
        name: 'run r-01 · the step that broke',
      });

      await waitFor(() => {
        expect(result.current).toMatchObject({ saveGlyph: '✓', saveLabel: 'Saved' });
      });
      expect(result.current.isSaving).toBe(false);
    });

    it('offers to download again when the QA calls the dialog off', async () => {
      saving('cancelled');

      const { result } = renderHook(() => useLightboxViewModel());

      act(() => {
        result.current.onSave();
      });

      await waitFor(() => {
        expect(result.current).toMatchObject({ isSaving: false, saveLabel: 'Download' });
      });
    });

    it('says so when the file could not be saved', async () => {
      saving('failed');

      const { result } = renderHook(() => useLightboxViewModel());

      act(() => {
        result.current.onSave();
      });

      await waitFor(() => {
        expect(result.current).toMatchObject({
          saveGlyph: '!',
          saveLabel: 'Could not save',
        });
      });
    });

    it('does NOT offer to save while there is no screenshot on screen', () => {
      const saveShot = saving('saved');

      useAppStore.setState({ media: { ...SHOT, src: null, file: null } });

      const { result } = renderHook(() => useLightboxViewModel());

      act(() => {
        result.current.onSave();
      });

      expect(result.current.canSave).toBe(false);
      expect(saveShot).not.toHaveBeenCalled();
    });

    it('starts the next screenshot fresh', async () => {
      saving('saved');

      const { result } = renderHook(() => useLightboxViewModel());

      act(() => {
        result.current.onSave();
      });

      await waitFor(() => {
        expect(result.current.saveLabel).toBe('Saved');
      });

      act(() => {
        useAppStore.setState({ media: { ...SHOT, title: 'step 2' } });
      });

      expect(result.current.saveLabel).toBe('Download');
    });
  });

  it('closes on Escape', () => {
    renderHook(() => useLightboxViewModel());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(useAppStore.getState().media).toBeNull();
  });
});
