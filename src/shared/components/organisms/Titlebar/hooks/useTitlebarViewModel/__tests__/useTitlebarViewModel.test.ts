// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useTitlebarViewModel } from '@/shared/components/organisms/Titlebar/hooks/useTitlebarViewModel';
import { useAppStore, useMachineStore } from '@/store';

beforeEach(() => {
  useAppStore.setState({
    isResourcesOpen: false,
    modelMenuAt: null,
  });
  useMachineStore.setState({
    resources: { cpu: 0, ramMb: 0, ramCeilingGb: 32, processes: [] },
  });
});

describe('useTitlebarViewModel', () => {
  it('keeps only the drag strip during the first-run setup', () => {
    const { result } = renderHook(() => useTitlebarViewModel({ isBare: true }));

    expect(result.current.isBare).toBe(true);
    expect(result.current.className).toContain('titlebar--bare');
  });

  describe('the window controls', () => {
    afterEach(() => {
      Reflect.deleteProperty(window, 'qazinho');
    });

    it("leaves room for the Mac's traffic lights on the left", () => {
      window.qazinho = fakeQazinhoApi('darwin');

      expect(renderHook(() => useTitlebarViewModel()).result.current.className).toContain(
        'titlebar--mac',
      );
    });

    it("leaves room for Windows' and Linux's own controls on the right", () => {
      window.qazinho = fakeQazinhoApi('win32');

      const { className } = renderHook(() => useTitlebarViewModel()).result.current;

      expect(className).toContain('titlebar--overlay');
      expect(className).not.toContain('titlebar--mac');
    });
  });

  it('shows the whole bar everywhere else', () => {
    const { result } = renderHook(() => useTitlebarViewModel());

    expect(result.current.isBare).toBe(false);
    expect(result.current.className).not.toContain('titlebar--bare');
  });

  describe('the session ring', () => {
    const usedBy = (fiveHourUsed: number) => {
      useMachineStore.setState({
        usage: { fiveHourUsed, sevenDayUsed: null, resetsAt: 0 },
      } as never);

      return renderHook(() => useTitlebarViewModel()).result.current.sessionUsed;
    };

    it('is always in the bar, with what is left of the session', () => {
      expect(usedBy(0.05)).toBe(0.05);
      expect(usedBy(0.8)).toBe(0.8);
    });

    it('is out of the bar while the usage is unknown', () => {
      useMachineStore.setState({ usage: null } as never);

      expect(
        renderHook(() => useTitlebarViewModel()).result.current.sessionUsed,
      ).toBeNull();
    });
  });

  describe('onToggleResources', () => {
    it('closes the model menu, because they share the same corner', () => {
      useAppStore.setState({ modelMenuAt: 'titlebar' });

      const { result } = renderHook(() => useTitlebarViewModel());

      act(() => {
        result.current.onToggleResources();
      });

      expect(useAppStore.getState().isResourcesOpen).toBe(true);
      expect(useAppStore.getState().modelMenuAt).toBeNull();
    });
  });

  describe('sessionTip', () => {
    it('spells out how much of the session and of the week is used, the way agents show it', () => {
      useMachineStore.setState({
        usage: {
          fiveHourUsed: 0.44,
          sevenDayUsed: 0.18,
          resetsAt: 0,
          contextTokens: 0,
          contextWindow: 0,
        },
      });

      const { result } = renderHook(() => useTitlebarViewModel());

      expect(result.current.sessionTip.rows).toEqual([
        {
          id: 'session',
          label: '5-hour session',
          value: '44% used',
          detail: null,
          fillWidth: '44%',
          fillClassName: 'session-tip__fill session-tip__fill--easy',
        },
        {
          id: 'week',
          label: 'This week',
          value: '18% used',
          detail: null,
          fillWidth: '18%',
          fillClassName: 'session-tip__fill session-tip__fill--easy',
        },
      ]);
    });

    it('warns on a bar as it nears the limit, not only on the ring', () => {
      useMachineStore.setState({
        usage: {
          fiveHourUsed: 0.95,
          sevenDayUsed: 0.8,
          resetsAt: 0,
          contextTokens: 0,
          contextWindow: 0,
        },
      });

      const { result } = renderHook(() => useTitlebarViewModel());

      expect(
        result.current.sessionTip.rows.map(({ fillClassName }) => fillClassName),
      ).toEqual([
        'session-tip__fill session-tip__fill--empty',
        'session-tip__fill session-tip__fill--tight',
      ]);
    });

    it('does NOT invent a week the agent never reported', () => {
      useMachineStore.setState({
        usage: {
          fiveHourUsed: 0.5,
          sevenDayUsed: null,
          resetsAt: 0,
          contextTokens: 0,
          contextWindow: 0,
        },
      });

      const { result } = renderHook(() => useTitlebarViewModel());

      expect(result.current.sessionTip.rows.map(({ id }) => id)).toEqual(['session']);
    });
  });

  describe('sessionLabel', () => {
    it('does NOT promise a reset time the agent never gave', () => {
      useMachineStore.setState({
        usage: {
          fiveHourUsed: 0.4,
          sevenDayUsed: null,
          resetsAt: 0,
          contextTokens: 0,
          contextWindow: 0,
        },
      });

      expect(renderHook(() => useTitlebarViewModel()).result.current.sessionLabel).toBe(
        '40% of session used',
      );
    });
  });
});
