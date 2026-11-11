// @vitest-environment jsdom
import type { ProStatus } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProSignIn } from '@/modules/Pro/hooks/useProSignIn';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useProStore } from '@/store';

const SIGNED_IN: ProStatus = {
  isSignedIn: true,
  account: { email: 'ana@loja.dev', name: 'Ana' },
  machine: { id: 'm1', name: 'MacBook-Ana' },
  orgs: [],
  isReachable: true,
};

beforeEach(() => {
  window.qazinho = fakeQazinhoApi('darwin');
  useProStore.setState({ status: { isSignedIn: false, canKeepToken: true } });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProSignIn', () => {
  describe('onBegin', () => {
    /** O mesmo login serve ao cartão da conta e à janela do projeto. */
    it('signs this computer in, and reads the account once it is in', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        proStatus: () => Promise.resolve(SIGNED_IN),
      };
      const { result } = renderHook(() => useProSignIn());

      act(() => {
        result.current.onBegin();
      });

      await waitFor(() => {
        expect(useProStore.getState().status).toEqual(SIGNED_IN);
      });
      expect(result.current.signIn?.phase).toBe('connected');
    });

    it('shows the steps while it waits for the browser', () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        signInPro: () => new Promise(() => undefined),
      };
      const { result } = renderHook(() => useProSignIn());

      act(() => {
        result.current.onBegin();
      });

      expect(result.current.signIn).toMatchObject({ phase: 'working', at: 'code' });
    });
  });

  describe('onCancel', () => {
    it('stops the sign-in and closes its steps', () => {
      const cancelProSignIn = vi.fn(() => Promise.resolve());

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        signInPro: () => new Promise(() => undefined),
        cancelProSignIn,
      };
      const { result } = renderHook(() => useProSignIn());

      act(() => {
        result.current.onBegin();
      });
      act(() => {
        result.current.onCancel();
      });

      expect(cancelProSignIn).toHaveBeenCalledOnce();
      expect(result.current.signIn).toBeNull();
    });
  });

  describe('onClose', () => {
    it('does NOT start anything, it only closes the steps', () => {
      const signInPro = vi.fn(() => new Promise<never>(() => undefined));

      window.qazinho = { ...fakeQazinhoApi('darwin'), signInPro };
      const { result } = renderHook(() => useProSignIn());

      act(() => {
        result.current.onClose();
      });

      expect(signInPro).not.toHaveBeenCalled();
      expect(result.current.signIn).toBeNull();
    });
  });
});
