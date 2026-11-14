// @vitest-environment jsdom
import type { SaveOutcome } from '@/shared/types';
import type { SyntheticEvent } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useLightboxViewModel } from '@/shared/components/organisms/Lightbox/hooks/useLightboxViewModel';
import { useAppStore } from '@/store';

const SHOT = {
  kicker: 'run r-01',
  title: 'the step that broke',
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

  describe('onShotLoad', () => {
    const loaded = (size: { naturalWidth: number; naturalHeight: number }) =>
      ({ currentTarget: size }) as unknown as SyntheticEvent<HTMLImageElement>;

    it('frames a shot in its own shape once it loads: a phone stands tall', () => {
      const { result } = renderHook(() => useLightboxViewModel());

      expect(result.current.frameStyle).toMatchObject({ '--shot-ratio': '1.6' });

      act(() => {
        result.current.onShotLoad(loaded({ naturalWidth: 780, naturalHeight: 1688 }));
      });

      expect(result.current.frameStyle).toMatchObject({
        '--shot-ratio': String(780 / 1688),
      });
    });

    it("does NOT carry one shot's shape over to the next one opened", () => {
      const { result } = renderHook(() => useLightboxViewModel());

      act(() => {
        result.current.onShotLoad(loaded({ naturalWidth: 780, naturalHeight: 1688 }));
      });
      act(() => {
        useAppStore.setState({ media: { ...SHOT, src: 'data:image/jpeg;base64,other' } });
      });

      expect(result.current.frameStyle).toMatchObject({ '--shot-ratio': '1.6' });
    });

    it('keeps the frame it has when a picture reports no size', () => {
      const { result } = renderHook(() => useLightboxViewModel());

      act(() => {
        result.current.onShotLoad(loaded({ naturalWidth: 0, naturalHeight: 0 }));
      });

      expect(result.current.frameStyle).toMatchObject({ '--shot-ratio': '1.6' });
    });
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
        name: 'run r-01: the step that broke',
      });

      await waitFor(() => {
        expect(result.current).toMatchObject({ saveIcon: 'passed', saveLabel: 'Saved' });
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
          saveIcon: 'attention',
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
