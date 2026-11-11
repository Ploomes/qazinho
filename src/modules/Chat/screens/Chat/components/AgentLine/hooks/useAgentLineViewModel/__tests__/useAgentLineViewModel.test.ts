// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAgentLineViewModel } from '@/modules/Chat/screens/Chat/components/AgentLine/hooks/useAgentLineViewModel';
import { useAppStore, useMachineStore } from '@/store';

const usageOf = (fiveHourUsed: number, sevenDayUsed: number | null = null) => {
  useMachineStore.setState({
    usage: {
      fiveHourUsed,
      sevenDayUsed,
      resetsAt: 0,
      contextTokens: 0,
      contextWindow: 0,
    },
  });
};

beforeEach(() => {
  useAppStore.setState({ isResourcesOpen: false, modelMenuAt: null });
  useMachineStore.setState({ usage: null });
});

describe('useAgentLineViewModel', () => {
  describe('isSessionShown', () => {
    /** O QA gostava do anel que dizia quanto da sessão já foi: ele fica sempre à vista. */
    it('shows the ring whenever the agent reported its session, filled by what is used', () => {
      usageOf(0.3);

      expect(renderHook(() => useAgentLineViewModel()).result.current).toMatchObject({
        isSessionShown: true,
        sessionUsed: 0.3,
        gaugeLabel: '30% used',
      });
    });

    /** O número em palavras só aparece quando a sessão está acabando. */
    it('says the percent in words only from 80% used', () => {
      usageOf(0.79);
      expect(
        renderHook(() => useAgentLineViewModel()).result.current.hasSessionLabel,
      ).toBe(false);

      usageOf(0.8);
      expect(
        renderHook(() => useAgentLineViewModel()).result.current.hasSessionLabel,
      ).toBe(true);
    });

    it('does NOT show a session the agent never reported', () => {
      expect(
        renderHook(() => useAgentLineViewModel()).result.current.isSessionShown,
      ).toBe(false);
    });
  });

  describe('sessionTip', () => {
    it('spells out how much of the session and of the week is used', () => {
      usageOf(0.95, 0.8);

      expect(
        renderHook(() => useAgentLineViewModel()).result.current.sessionTip.rows.map(
          ({ value, fillClassName }) => [value, fillClassName],
        ),
      ).toEqual([
        ['95% used', 'session-tip__fill session-tip__fill--empty'],
        ['80% used', 'session-tip__fill session-tip__fill--tight'],
      ]);
    });

    it('does NOT invent a week the agent never reported', () => {
      usageOf(0.9);

      expect(
        renderHook(() => useAgentLineViewModel()).result.current.sessionTip.rows.map(
          ({ id }) => id,
        ),
      ).toEqual(['session']);
    });
  });

  /** Com o anel ao lado, as palavras sobravam e empurravam o enviar para outra linha. */
  it('says how much of the session is used as a bare percent beside the ring', () => {
    usageOf(0.9);

    expect(renderHook(() => useAgentLineViewModel()).result.current.sessionLabel).toBe(
      '90%',
    );
  });

  describe('onToggleModelMenu', () => {
    it('opens the model menu over the chat field', () => {
      const { result } = renderHook(() => useAgentLineViewModel());

      act(() => {
        result.current.onToggleModelMenu();
      });

      expect(useAppStore.getState().modelMenuAt).toBe('composer');
    });
  });
});
