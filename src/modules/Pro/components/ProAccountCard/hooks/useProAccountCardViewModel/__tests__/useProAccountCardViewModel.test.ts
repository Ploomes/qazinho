// @vitest-environment jsdom
import type { ProStatus } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useProAccountCardViewModel } from '@/modules/Pro/components/ProAccountCard/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useProStore, useSettingsStore } from '@/store';

const LOJA = {
  slug: 'loja',
  name: 'Loja Online',
  role: 'editor',
  billingStatus: 'active',
} as const;
const SIGNED_IN: ProStatus = {
  isSignedIn: true,
  account: { email: 'ana@loja.dev', name: 'Ana Souza' },
  machine: { id: 'm1', name: 'MacBook-Ana' },
  orgs: [
    LOJA,
    { slug: 'leitura', name: 'Conecta', role: 'reader', billingStatus: 'active' },
    { slug: 'outra', name: 'Outra', role: 'admin', billingStatus: 'trialing' },
  ],
  isReachable: true,
};

let opened: string[] = [];
let signedIn = 0;

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  opened = [];
  signedIn = 0;
  useProStore.setState({ status: SIGNED_IN, shares: [] });
  useSettingsStore.setState({ isSidebarShut: false });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    openProPage: (path) => {
      opened.push(path);

      return Promise.resolve(true);
    },
    signInPro: () => {
      signedIn += 1;

      return Promise.resolve({
        steps: ['code', 'browser', 'account'],
        phase: 'connected',
        account: 'ana@loja.dev',
      });
    },
    proStatus: () => Promise.resolve(SIGNED_IN),
  };
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

const view = () => renderHook(() => useProAccountCardViewModel());

describe('useProAccountCardViewModel', () => {
  describe('what it shows', () => {
    it('shows nothing until it knows where this computer stands', () => {
      useProStore.setState({ status: null });

      expect(view().result.current.isShown).toBe(false);
    });

    it('offers a way into the account while signed out, naming no org', () => {
      useProStore.setState({ status: { isSignedIn: false, canKeepToken: true } });

      expect(view().result.current).toMatchObject({
        isShown: true,
        isSignedIn: false,
        title: 'Sign in to your account',
        hasSubtitle: false,
        popup: undefined,
      });
    });

    it('names the person and how many orgs they are in', () => {
      expect(view().result.current).toMatchObject({
        isSignedIn: true,
        title: 'Ana Souza',
        subtitle: '3 orgs',
        initials: 'AS',
        email: 'ana@loja.dev',
        machine: 'This computer · MacBook-Ana',
        hasAttention: false,
        popup: 'dialog',
      });
    });

    it('names the one org and the role there of a person in a single org', () => {
      useProStore.setState({ status: { ...SIGNED_IN, orgs: [LOJA] } });

      expect(view().result.current.subtitle).toBe('Loja Online · editor');
    });

    it('says an account is in no org yet, and offers nothing to clone', () => {
      useProStore.setState({ status: { ...SIGNED_IN, orgs: [] } });

      expect(view().result.current).toMatchObject({ subtitle: 'no org', hasOrgs: false });
    });

    it('lists every org with the role and payment there, choosing none', () => {
      expect(view().result.current.orgs).toEqual([
        { slug: 'loja', name: 'Loja Online', note: 'editor · active' },
        { slug: 'leitura', name: 'Conecta', note: 'reader · active' },
        { slug: 'outra', name: 'Outra', note: 'admin · in trial' },
      ]);
    });

    it('says what the QA should know of any linked project, on the card itself', () => {
      useProStore.setState({
        shares: [
          {
            projectId: 'p1',
            orgSlug: 'outra',
            state: 'gone',
            syncedAt: null,
            pending: [],
            conflicts: [],
          },
        ],
      });

      expect(view().result.current).toMatchObject({
        hasAttention: true,
        attention: 'A project you linked is no longer in its org.',
      });
    });
  });

  describe('onToggle', () => {
    it('starts signing in from a computer signed out', async () => {
      useProStore.setState({ status: { isSignedIn: false, canKeepToken: true } });

      const { result } = view();

      act(() => {
        result.current.onToggle();
      });

      await waitFor(() => {
        expect(useProStore.getState().status).toEqual(SIGNED_IN);
      });
      expect(signedIn).toBe(1);
    });

    it('opens the account once signed in, and shuts it again', () => {
      const { result } = view();

      act(() => {
        result.current.onToggle();
      });

      expect(result.current).toMatchObject({ isOpen: true, isExpanded: true });

      act(() => {
        result.current.onToggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('opens the sidebar first when it is folded to a rail', () => {
      useSettingsStore.setState({ isSidebarShut: true });

      const { result } = view();

      act(() => {
        result.current.onToggle();
      });

      expect(useSettingsStore.getState().isSidebarShut).toBe(false);
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('onClone', () => {
    it('opens the window to clone a project and shuts the account', () => {
      const { result } = view();

      act(() => {
        result.current.onToggle();
      });
      act(() => {
        result.current.onClone();
      });

      expect(result.current).toMatchObject({ isCloning: true, isOpen: false });
    });
  });

  describe('onCloseClone', () => {
    it('shuts the window to clone a project', () => {
      const { result } = view();

      act(() => {
        result.current.onClone();
      });
      act(() => {
        result.current.onCloseClone();
      });

      expect(result.current.isCloning).toBe(false);
    });
  });

  describe('onOpenSite', () => {
    it('opens the one org of a person in a single org', () => {
      useProStore.setState({ status: { ...SIGNED_IN, orgs: [LOJA] } });
      const { result } = view();

      act(() => {
        result.current.onOpenSite();
      });

      expect(opened).toEqual(['/loja']);
    });

    it('opens the list of orgs of a person in several', () => {
      const { result } = view();

      act(() => {
        result.current.onOpenSite();
      });

      expect(opened).toEqual(['/app']);
    });

    it('opens where an account in no org opens one', () => {
      useProStore.setState({ status: { ...SIGNED_IN, orgs: [] } });
      const { result } = view();

      act(() => {
        result.current.onOpenSite();
      });

      expect(opened).toEqual(['/app/new']);
    });
  });

  describe('onSignOut', () => {
    it('signs this computer out and shuts the account', async () => {
      const { result } = view();

      act(() => {
        result.current.onSignOut();
      });

      await waitFor(() => {
        expect(useProStore.getState().status).toEqual({
          isSignedIn: false,
          canKeepToken: true,
        });
      });
      expect(result.current.isSigningOut).toBe(false);
    });
  });
});
