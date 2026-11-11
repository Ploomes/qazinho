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
  describe('the session ring', () => {
    /** O QA quer o anel e o número sempre à vista, sem esperar a sessão acabar. */
    it('shows the ring and the percent at any use, filled by what is used', () => {
      usageOf(0.3);

      expect(renderHook(() => useAgentLineViewModel()).result.current).toMatchObject({
        sessionUsed: 0.3,
        hasSessionLabel: true,
        sessionLabel: '30%',
        gaugeLabel: '30% used',
      });
    });

    /** Um 0% inventado seria um mock: sem o que o agente informou, o anel fica vazio. */
    it('keeps the ring empty, with no number, until the agent reports its session', () => {
      const { result } = renderHook(() => useAgentLineViewModel());

      expect(result.current).toMatchObject({
        sessionUsed: 0,
        hasSessionLabel: false,
        gaugeLabel: 'Claude Code has not reported the session use yet.',
      });
      expect(result.current.sessionTip.rows).toEqual([]);
      expect(result.current.sessionTip.note).toBe(
        'Claude Code has not reported the session use yet.',
      );
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
