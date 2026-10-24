// @vitest-environment jsdom
import type { ProStatus } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useProCardViewModel } from '@/modules/Pro/components/ProCard/hooks/useProCardViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useProStore } from '@/store';

const SIGNED_IN: ProStatus = {
  isSignedIn: true,
  account: { email: 'ana@loja.dev', name: 'Ana Souza' },
  machine: { id: 'm1', name: 'MacBook-Ana' },
  orgs: [
    {
      slug: 'loja-online',
      name: 'Loja Online',
      role: 'editor',
      billingStatus: 'trialing',
    },
    { slug: 'conecta', name: 'Conecta', role: 'reader', billingStatus: 'blocked' },
  ],
  isReachable: true,
};

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  useProStore.setState({ status: null, shares: [] });
  window.qazinho = fakeQazinhoApi('darwin');
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProCardViewModel', () => {
  it('offers to sign in while signed out', async () => {
    const { result } = renderHook(() => useProCardViewModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.canSignIn).toBe(true);
    expect(result.current.hasNoKeychain).toBe(false);
  });

  it('does NOT offer to sign in on a computer with no keychain', async () => {
    window.qazinho.proStatus = vi
      .fn()
      .mockResolvedValue({ isSignedIn: false, canKeepToken: false });
    const { result } = renderHook(() => useProCardViewModel());

    await waitFor(() => {
      expect(result.current.hasNoKeychain).toBe(true);
    });

    expect(result.current.canSignIn).toBe(false);
  });

  it('shows the account, this computer and each org with its role and payment', async () => {
    window.qazinho.proStatus = vi.fn().mockResolvedValue(SIGNED_IN);
    const { result } = renderHook(() => useProCardViewModel());

    await waitFor(() => {
      expect(result.current.isSignedIn).toBe(true);
    });

    expect(result.current.subtitle).toBe('Signed in as Ana Souza');
    expect(result.current.machine).toBe('MacBook-Ana');
    expect(result.current.orgs).toEqual([
      {
        slug: 'loja-online',
        name: 'Loja Online',
        role: 'editor',
        billing: 'in trial',
        billingClassName: 'pro-card__billing pro-card__billing--pass',
      },
      {
        slug: 'conecta',
        name: 'Conecta',
        role: 'reader',
        billing: 'blocked',
        billingClassName: 'pro-card__billing pro-card__billing--fail',
      },
    ]);
    expect(result.current.isReachable).toBe(true);
  });

  it('reads the account again once the sign-in ends signed in', async () => {
    window.qazinho.proStatus = vi
      .fn()
      .mockResolvedValueOnce({ isSignedIn: false, canKeepToken: true })
      .mockResolvedValue(SIGNED_IN);
    const { result } = renderHook(() => useProCardViewModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.onSignIn();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.isSignedIn).toBe(true);
    });
    expect(result.current.signIn).toMatchObject({ phase: 'connected' });
  });

  it('closes the popup without asking again when the sign-in is cancelled', async () => {
    window.qazinho.signInPro = vi.fn().mockResolvedValue({
      steps: ['code', 'browser', 'account'],
      phase: 'cancelled',
    });
    const { result } = renderHook(() => useProCardViewModel());

    await act(async () => {
      result.current.onSignIn();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.signIn).toBeNull();
    });
    expect(result.current.isSignedIn).toBe(false);
  });

  it('signs this computer out', async () => {
    window.qazinho.proStatus = vi.fn().mockResolvedValue(SIGNED_IN);
    const { result } = renderHook(() => useProCardViewModel());

    await waitFor(() => {
      expect(result.current.isSignedIn).toBe(true);
    });

    await act(async () => {
      result.current.onSignOut();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.isSignedIn).toBe(false);
    });
    expect(window.qazinho.signOutPro).toBeDefined();
  });
});
