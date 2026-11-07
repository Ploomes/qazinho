// @vitest-environment jsdom
import type { IOutsideAgent, IOutsideServer } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useOutsideServerCardViewModel } from '@/modules/Setup/components/OutsideServerCard/hooks/useOutsideServerCardViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useProStore } from '@/store';

const CLAUDE: IOutsideAgent = { id: 'claude-code', name: 'Claude Code', isAdded: false };

/** Uma main de mentira: a porta, os agentes, e o que foi pedido a ela. */
function mainWith(props: { server?: IOutsideServer; agents?: IOutsideAgent[] } = {}) {
  let server = props.server ?? { isOn: true, isBusy: false };
  let agents = props.agents ?? [CLAUDE];
  const add = vi.fn((agentId: string) => {
    agents = agents.map((one) => (one.id === agentId ? { ...one, isAdded: true } : one));

    return Promise.resolve({ ok: true as const });
  });
  const remove = vi.fn(() => Promise.resolve({ ok: true as const }));
  const copy = vi.fn(() => Promise.resolve(true));
  const turn = vi.fn((isOn: boolean) => {
    server = { isOn, isBusy: false };

    return Promise.resolve(server);
  });

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    outsideServer: () => Promise.resolve(server),
    outsideAgents: () => Promise.resolve(agents),
    turnOutsideServer: turn,
    renewOutsideServer: () => Promise.resolve({ isOn: true, isBusy: false }),
    addOutsideAgent: add,
    removeOutsideAgent: remove,
    copyOutsideAddress: copy,
  };

  return { add, remove, copy, turn };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useOutsideServerCardViewModel', () => {
  describe('the two reaches', () => {
    const SIGNED_IN = {
      isSignedIn: true as const,
      account: { email: 'ana@loja.test', name: 'Ana' },
      machine: { id: 'm1', name: 'Mac' },
      orgs: [],
      isReachable: true,
    };

    afterEach(() => {
      useProStore.setState({ status: null });
    });

    /** O app grátis nunca fala de uma org: quem não tem conta não vê o servidor dela. */
    it('offers the orgs only to who signed in to an account', async () => {
      mainWith({ server: { isOn: false, isBusy: false } });
      useProStore.setState({ status: { isSignedIn: false, canKeepToken: true } });

      const { result } = renderHook(() => useOutsideServerCardViewModel());

      expect(result.current.hasOrg).toBe(false);

      act(() => {
        useProStore.setState({ status: SIGNED_IN });
      });

      await waitFor(() => {
        expect(result.current.hasOrg).toBe(true);
      });
    });
  });

  it('does NOT ask the agents while the server is off', async () => {
    mainWith({ server: { isOn: false, isBusy: false } });

    const { result } = renderHook(() => useOutsideServerCardViewModel());

    await waitFor(() => {
      expect(result.current.isOn).toBe(false);
    });
    expect(result.current.agents).toEqual([]);
  });

  it('turns the server on, and then looks for the agents', async () => {
    const { turn } = mainWith({ server: { isOn: false, isBusy: false } });
    const { result } = renderHook(() => useOutsideServerCardViewModel());

    act(() => {
      result.current.onToggle(true);
    });

    expect(result.current.isOn).toBe(true);

    await waitFor(() => {
      expect(result.current.agents.map(({ id }) => id)).toEqual(['claude-code']);
    });
    expect(turn).toHaveBeenCalledWith(true);
  });

  it('adds the server to an agent, and offers to take it out after', async () => {
    const { add } = mainWith();
    const { result } = renderHook(() => useOutsideServerCardViewModel());

    await waitFor(() => {
      expect(result.current.agents[0]?.actionLabel).toBe('Add');
    });

    act(() => {
      result.current.agents[0]?.onAction();
    });

    await waitFor(() => {
      expect(result.current.agents[0]?.actionLabel).toBe('Remove');
    });
    expect(add).toHaveBeenCalledWith('claude-code');
    expect(result.current.hasAdded).toBe(true);
  });

  it('says it is adding while the agent takes its time', async () => {
    // Adicionar ao Claude Code leva segundos; sem dizer nada, o QA achava que tinha travado.
    mainWith();
    let finish = (_done: { ok: true }) => {};
    window.qazinho = {
      ...window.qazinho,
      addOutsideAgent: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    };

    const { result } = renderHook(() => useOutsideServerCardViewModel());

    await waitFor(() => {
      expect(result.current.agents[0]?.actionVariant).toBe('primary');
    });

    act(() => {
      result.current.agents[0]?.onAction();
    });

    expect(result.current.agents[0]?.actionLabel).toBe('Adding…');
    expect(result.current.agents[0]?.isDoing).toBe(true);

    act(() => {
      finish({ ok: true });
    });

    await waitFor(() => {
      expect(result.current.agents[0]?.isDoing).toBe(false);
    });
  });

  it('waits for the server before offering the switch', async () => {
    mainWith({ server: { isOn: false, isBusy: false } });

    const { result } = renderHook(() => useOutsideServerCardViewModel());

    expect(result.current.isReady).toBe(false);

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
  });

  it('says why an agent refused', async () => {
    mainWith();
    window.qazinho = {
      ...window.qazinho,
      addOutsideAgent: () => Promise.resolve({ ok: false as const, error: 'No way.' }),
    };

    const { result } = renderHook(() => useOutsideServerCardViewModel());

    await waitFor(() => {
      expect(result.current.agents).toHaveLength(1);
    });

    act(() => {
      result.current.agents[0]?.onAction();
    });

    await waitFor(() => {
      expect(result.current.failure).toBe('No way.');
    });
  });

  it('says when no agent it can set up is here', async () => {
    mainWith({ agents: [] });

    const { result } = renderHook(() => useOutsideServerCardViewModel());

    await waitFor(() => {
      expect(result.current.hasNoAgents).toBe(true);
    });
    expect(result.current.isChecking).toBe(false);
  });

  it('shows the port is busy, and changes it when asked', async () => {
    mainWith({ server: { isOn: true, isBusy: true } });

    const { result } = renderHook(() => useOutsideServerCardViewModel());

    await waitFor(() => {
      expect(result.current.isBusy).toBe(true);
    });

    act(() => {
      result.current.onRenew();
    });

    await waitFor(() => {
      expect(result.current.isBusy).toBe(false);
    });
  });

  it('says it copied the address for a moment', async () => {
    const { copy } = mainWith();
    const { result } = renderHook(() => useOutsideServerCardViewModel());

    expect(result.current.copyLabel).toBe('Copy the address');

    act(() => {
      result.current.onCopy();
    });

    await waitFor(() => {
      expect(result.current.copyLabel).toBe('Copied');
    });
    expect(copy).toHaveBeenCalledOnce();

    await waitFor(
      () => {
        expect(result.current.copyLabel).toBe('Copy the address');
      },
      { timeout: 3_000 },
    );
  });
});
