// @vitest-environment jsdom
import type { IProShare, ProStatus } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useProShareFieldViewModel } from '@/modules/Pro/components/ProShareField/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useProStore, useSettingsStore } from '@/store';

const SIGNED_IN: ProStatus = {
  isSignedIn: true,
  account: { email: 'ana@loja.dev', name: 'Ana' },
  machine: { id: 'm1', name: 'MacBook-Ana' },
  orgs: [
    { slug: 'loja', name: 'Loja Online', role: 'editor', billingStatus: 'active' },
    { slug: 'leitura', name: 'Conecta', role: 'reader', billingStatus: 'active' },
    { slug: 'parada', name: 'Parada', role: 'owner', billingStatus: 'blocked' },
  ],
  isReachable: true,
};
const SHARED: IProShare = {
  projectId: 'p1',
  orgSlug: 'loja',
  state: 'synced',
  syncedAt: new Date(2026, 9, 24, 14, 5).toISOString(),
  conflicts: [],
};

let asked: { projectId: string; orgSlug: string | null }[] = [];

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  asked = [];
  useProStore.setState({ status: SIGNED_IN, shares: [] });
  useAppStore.setState({ modal: 'project', screen: 'workspace' });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    shareProject: (props) => {
      asked.push(props);

      return Promise.resolve({
        projectId: props.projectId,
        orgSlug: props.orgSlug,
        state: props.orgSlug === null ? 'off' : 'waiting',
        syncedAt: null,
        conflicts: [],
      });
    },
  };
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProShareFieldViewModel', () => {
  describe('what it shows', () => {
    it('asks for the project to be created first', () => {
      const { result } = renderHook(() => useProShareFieldViewModel({ projectId: null }));

      expect(result.current).toMatchObject({
        isUnsaved: true,
        hasOrgs: false,
        isSignedOut: false,
      });
    });

    it('asks a signed-out machine to sign in first', () => {
      useProStore.setState({ status: { isSignedIn: false, canKeepToken: true } });

      const { result } = renderHook(() => useProShareFieldViewModel({ projectId: 'p1' }));

      expect(result.current).toMatchObject({ isSignedOut: true, hasOrgs: false });
    });

    it('points an account with no org to the subscription', () => {
      useProStore.setState({ status: { ...SIGNED_IN, orgs: [] } });

      const { result } = renderHook(() => useProShareFieldViewModel({ projectId: 'p1' }));

      expect(result.current).toMatchObject({ hasNoOrgs: true, hasOrgs: false });
    });

    it('offers keeping it on this computer, then each org, with why one cannot take it', () => {
      const { result } = renderHook(() => useProShareFieldViewModel({ projectId: 'p1' }));

      expect(
        result.current.choices.map(({ name, note, isOn, isDisabled }) => ({
          name,
          note,
          isOn,
          isDisabled,
        })),
      ).toEqual([
        {
          name: 'Only on this computer',
          note: 'not shared',
          isOn: true,
          isDisabled: false,
        },
        { name: 'Loja Online', note: 'editor', isOn: false, isDisabled: false },
        { name: 'Conecta', note: 'you only read here', isOn: false, isDisabled: true },
        { name: 'Parada', note: 'org blocked', isOn: false, isDisabled: true },
      ]);
    });

    it('says where the sending stands, with when it last reached the org', () => {
      useProStore.setState({ shares: [SHARED] });

      const { result } = renderHook(() => useProShareFieldViewModel({ projectId: 'p1' }));

      expect(result.current.state).toMatchObject({
        icon: 'passed',
        label: 'Sent to the org',
        className: 'pro-share__state pro-share__state--pass',
      });
      expect(result.current.state?.when).toMatch(/14:05/);
    });
  });

  describe('onClick', () => {
    it('shares the project with the org picked, and lands where it stands', async () => {
      const { result } = renderHook(() => useProShareFieldViewModel({ projectId: 'p1' }));

      act(() => {
        result.current.choices[1]?.onClick();
      });

      await waitFor(() => {
        expect(useProStore.getState().shares).toMatchObject([
          { projectId: 'p1', orgSlug: 'loja' },
        ]);
      });
      expect(asked).toEqual([{ projectId: 'p1', orgSlug: 'loja' }]);
    });

    it('does NOT share with an org that cannot take it, nor ask again for the one it has', async () => {
      useProStore.setState({ shares: [SHARED] });

      const { result } = renderHook(() => useProShareFieldViewModel({ projectId: 'p1' }));

      act(() => {
        result.current.choices[1]?.onClick();
        result.current.choices[2]?.onClick();
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(asked).toEqual([]);
    });

    it('stops sharing once it goes back to this computer alone', async () => {
      useProStore.setState({ shares: [SHARED] });

      const { result } = renderHook(() => useProShareFieldViewModel({ projectId: 'p1' }));

      act(() => {
        result.current.choices[0]?.onClick();
      });

      await waitFor(() => {
        expect(useProStore.getState().shares).toEqual([]);
      });
    });
  });

  describe('onOpenPro', () => {
    it('closes the project and opens QAzinho Pro in the settings', () => {
      useProStore.setState({ status: { isSignedIn: false, canKeepToken: true } });

      const { result } = renderHook(() => useProShareFieldViewModel({ projectId: 'p1' }));

      act(() => {
        result.current.onOpenPro();
      });

      expect(useAppStore.getState()).toMatchObject({ modal: null, screen: 'settings' });
      expect(useSettingsStore.getState().tab).toBe('pro');
    });
  });
});
