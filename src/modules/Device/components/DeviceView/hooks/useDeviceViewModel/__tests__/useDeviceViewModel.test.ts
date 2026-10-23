// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useDeviceViewModel } from '@/modules/Device/components/DeviceView/hooks/useDeviceViewModel';
import { DEVICE } from '@/modules/Device/constants';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
});

describe('useDeviceViewModel', () => {
  it('stays off and says so while no run has started', () => {
    const { result } = renderHook(() => useDeviceViewModel());

    expect(result.current.hasScreen).toBe(false);
    expect(result.current.hasControls).toBe(false);
    expect(result.current.stateText).toBe('idle');
  });

  it('puts the Estagiário in the mood of the workspace: asleep before a run, alarmed at a failure', () => {
    const { result } = renderHook(() => useDeviceViewModel());

    expect(result.current.mood).toBe('sleeping');

    useWorkspaceStore.setState({
      workspaces: [{ ...makeWorkspace(), status: 'failed' }],
    });

    expect(renderHook(() => useDeviceViewModel()).result.current.mood).toBe('bug');
  });

  describe('window size', () => {
    it('offers the window sizes for a browser, the one kept marked, and none for a phone', () => {
      const { result } = renderHook(() => useDeviceViewModel());

      expect(
        result.current.viewports.map(({ id, size, isActive }) => [id, size, isActive]),
      ).toEqual([
        ['desktop', '1280 × 800', true],
        ['tablet', '820 × 1180', false],
        ['phone', '390 × 844', false],
      ]);
      expect(result.current.screenRatio).toBe(1280 / 800);

      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), planKind: 'mobile' }],
      });

      expect(renderHook(() => useDeviceViewModel()).result.current.viewports).toEqual([]);
    });

    it('lets the size be picked before the first run, not only up close', () => {
      const { result } = renderHook(() => useDeviceViewModel());

      expect(result.current.hasScreen).toBe(false);
      expect(result.current.hasViewportPicker).toBe(true);
      expect(result.current.viewportNote).toBe('The next run opens at this size.');
    });

    it('does NOT offer a size for a phone app, nor beside the device while it is up close', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), planKind: 'mobile' }],
      });

      expect(
        renderHook(() => useDeviceViewModel()).result.current.hasViewportPicker,
      ).toBe(false);

      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: [] })] });

      const { result, unmount } = renderHook(() => useDeviceViewModel());

      act(() => {
        result.current.onFocus();
      });

      expect(result.current.isFocused).toBe(true);
      expect(result.current.hasViewportPicker).toBe(false);
      unmount();
    });

    it('keeps the size picked between runs, and says the next run opens at it', () => {
      const resizeDevice = vi.fn(() => Promise.resolve());

      window.qazinho = { ...fakeQazinhoApi('darwin'), resizeDevice };

      const { result } = renderHook(() => useDeviceViewModel());

      act(() => {
        result.current.onSelectViewport('phone');
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.viewportId).toBe('phone');
      expect(result.current.screenRatio).toBe(390 / 844);
      expect(result.current.viewportNote).toBe('The next run opens at this size.');
      expect(resizeDevice).not.toHaveBeenCalled();
    });

    it('resizes the browser of a run under way', () => {
      const resizeDevice = vi.fn(() => Promise.resolve());

      window.qazinho = { ...fakeQazinhoApi('darwin'), resizeDevice };
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: [] })] });

      const { result } = renderHook(() => useDeviceViewModel());

      act(() => {
        result.current.onSelectViewport('tablet');
      });

      expect(resizeDevice).toHaveBeenCalledWith({
        workspaceId: 'w1',
        viewport: { width: 820, height: 1180 },
      });
      expect(result.current.viewportNote).toBe('');
    });
  });

  it('marks the step the agent is on while it drives', () => {
    const walked = walkRun({ verdicts: ['passed'] });

    useWorkspaceStore.setState({
      workspaces: [{ ...walked, live: { ...walked.live!, doingIndex: 1 } }],
    });

    const { result } = renderHook(() => useDeviceViewModel());

    expect(result.current.isLive).toBe(true);
    expect(result.current.steps[0]?.verdict).toBe('passed');
    expect(result.current.steps[1]?.verdict).toBe('running');
    expect(result.current.steps[2]?.verdict).toBe('pending');
    expect(result.current.doingLabel).toBe('1 of 6');
  });

  it('counts the steps done in the language the QA reads', async () => {
    const walked = walkRun({ verdicts: ['passed'] });

    useWorkspaceStore.setState({ workspaces: [walked] });
    await i18n.changeLanguage('pt');

    const { result } = renderHook(() => useDeviceViewModel());

    expect(result.current.doingLabel).toBe('1 de 6');
    await i18n.changeLanguage('en');
  });

  it('shows the live stream while the run goes, and drops it once the run is over', () => {
    const walked = walkRun({ verdicts: ['passed'] });
    const url = 'http://127.0.0.1:5000/token/w1';

    useWorkspaceStore.setState({
      workspaces: [{ ...walked, live: { ...walked.live!, streamUrl: url } }],
    });

    expect(renderHook(() => useDeviceViewModel()).result.current.stream).toBe(url);

    useWorkspaceStore.setState({
      workspaces: [
        { ...walked, live: { ...walked.live!, streamUrl: url, isDone: true } },
      ],
    });

    expect(renderHook(() => useDeviceViewModel()).result.current.stream).toBeNull();
  });

  it('shows the last screenshot the device sent back', () => {
    useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['passed'] })] });

    const { result } = renderHook(() => useDeviceViewModel());

    expect(result.current.shot).toBe('data:image/jpeg;base64,shot-0');
  });

  it('has no screenshot to show before the first step comes back', () => {
    useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: [] })] });

    const { result } = renderHook(() => useDeviceViewModel());

    expect(result.current.shot).toBeNull();
  });

  it('names the way to the device up close with a word, not only an icon', () => {
    expect(renderHook(() => useDeviceViewModel()).result.current.focusLabel).toBe(
      'Expand',
    );
  });

  describe('steps', () => {
    it('shows how the last run went when none is going, the app reopened included', () => {
      const finished = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });

      useWorkspaceStore.setState({ workspaces: [{ ...finished, live: null }] });

      const { result } = renderHook(() => useDeviceViewModel());

      expect(result.current.steps.map(({ verdict }) => verdict).slice(0, 4)).toEqual([
        'passed',
        'failed',
        'skipped',
        'pending',
      ]);
      expect(result.current.doingLabel).toBe('3 of 6');
    });

    /** An exploration has no plan: the panel read "steps 1 of 0" and told the QA to hit Run plan. */
    it('lists the screens an exploration reached, with no plan count', () => {
      const walked = walkRun({ verdicts: ['passed'] });

      useWorkspaceStore.setState({
        workspaces: [
          {
            ...walked,
            plan: [],
            live: {
              ...walked.live!,
              kind: 'explore',
              outcomes: walked.live!.outcomes.map((outcome) => ({
                ...outcome,
                action: 'Home',
              })),
            },
          },
        ],
      });

      const { result } = renderHook(() => useDeviceViewModel());

      expect(result.current.steps).toEqual([
        { number: 1, action: 'Home', verdict: 'passed' },
      ]);
      expect(result.current).toMatchObject({
        stepsWord: 'screens',
        doingLabel: '',
        emptyStepsText: 'Each screen the agent reaches shows up here.',
      });
    });

    it('does NOT call a run of the plan anything but steps', () => {
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['passed'] })] });

      expect(renderHook(() => useDeviceViewModel()).result.current.stepsWord).toBe(
        'steps',
      );
    });
  });

  describe('viewportClassName', () => {
    it('hugs the screen of a browser, fills the height for a phone, and leaves the empty device alone', () => {
      expect(
        renderHook(() => useDeviceViewModel()).result.current.viewportClassName,
      ).toBe('device-view__viewport');

      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: [] })] });

      expect(
        renderHook(() => useDeviceViewModel()).result.current.viewportClassName,
      ).toBe('device-view__viewport device-view__viewport--browser');

      useWorkspaceStore.setState({
        workspaces: [{ ...walkRun({ verdicts: [] }), planKind: 'mobile' }],
      });

      expect(
        renderHook(() => useDeviceViewModel()).result.current.viewportClassName,
      ).toBe('device-view__viewport device-view__viewport--fill');
    });

    it('frames the screen in the shape of the size picked', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...walkRun({ verdicts: [] }), viewportId: 'phone' }],
      });

      expect(renderHook(() => useDeviceViewModel()).result.current.style).toMatchObject({
        '--device-ratio': String(390 / 844),
        '--device-chrome': `${String(DEVICE.chromeHeight)}px`,
        '--device-steps-min': `${String(DEVICE.stepsMinHeight)}px`,
      });
    });

    it('frames a phone in the shape of its own screen, a foldable nearly square', () => {
      const header = new Uint8Array(33);

      header.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      new DataView(header.buffer).setUint32(16, 1768);
      new DataView(header.buffer).setUint32(20, 2208);

      const walked = { ...walkRun({ verdicts: [] }), planKind: 'mobile' as const };

      useWorkspaceStore.setState({
        workspaces: [
          {
            ...walked,
            live: walked.live && {
              ...walked.live,
              shot: `data:image/png;base64,${btoa(String.fromCharCode(...header))}`,
            },
          },
        ],
      });

      expect(renderHook(() => useDeviceViewModel()).result.current.screenRatio).toBe(
        1768 / 2208,
      );
    });

    it('frames a phone tall until its first screenshot comes', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...walkRun({ verdicts: [] }), planKind: 'mobile' }],
      });

      expect(renderHook(() => useDeviceViewModel()).result.current.screenRatio).toBe(
        DEVICE.phoneRatio,
      );
    });
  });

  describe('elapsedLabel', () => {
    it('adds what the run cost so far, once its agent said', () => {
      const walked = walkRun({ verdicts: ['passed'] });

      useWorkspaceStore.setState({ workspaces: [walked] });

      expect(renderHook(() => useDeviceViewModel()).result.current.elapsedLabel).toBe(
        'live · 0:00',
      );

      useWorkspaceStore.setState({
        workspaces: [
          { ...walked, live: { ...walked.live!, elapsedSec: 75, costUsd: 0.042 } },
        ],
      });

      expect(renderHook(() => useDeviceViewModel()).result.current.elapsedLabel).toBe(
        'live · 1:15 · $0.042',
      );
    });
  });

  describe('hasControls', () => {
    it('offers pause and stop while the run goes, and resume once paused', () => {
      const walked = walkRun({ verdicts: ['passed'] });

      useWorkspaceStore.setState({ workspaces: [walked] });

      const running = renderHook(() => useDeviceViewModel()).result.current;

      expect(running.hasControls).toBe(true);
      expect(running.pauseLabel).toBe('Pause');

      useWorkspaceStore.setState({
        workspaces: [{ ...walked, live: { ...walked.live!, isRunning: false } }],
      });

      expect(renderHook(() => useDeviceViewModel()).result.current.pauseLabel).toBe(
        'Resume',
      );
    });

    it('does NOT offer to pause or stop a run that was stopped', () => {
      const walked = walkRun({ verdicts: ['passed'] });

      useWorkspaceStore.setState({
        workspaces: [{ ...walked, live: { ...walked.live!, isDone: true, shot: null } }],
      });

      const { result } = renderHook(() => useDeviceViewModel());

      expect(result.current.hasControls).toBe(false);
      expect(result.current.hasScreen).toBe(false);
    });
  });

  describe('focus', () => {
    it('does NOT offer focus while there is no screen to show', () => {
      expect(renderHook(() => useDeviceViewModel()).result.current.canFocus).toBe(false);
    });

    it('puts the device in focus once there is a screen, and brings it back', () => {
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['passed'] })] });

      const { result } = renderHook(() => useDeviceViewModel());

      expect(result.current.canFocus).toBe(true);

      act(() => {
        result.current.onFocus();
      });

      expect(result.current).toMatchObject({ isFocused: true, canFocus: false });

      act(() => {
        result.current.onUnfocus();
      });

      expect(result.current.isFocused).toBe(false);
    });

    it('streams the device at full detail while it is in focus, and at 1x once it leaves', () => {
      const focusDevice = vi.fn(() => Promise.resolve());
      const walked = walkRun({ verdicts: ['passed'] });

      window.qazinho = { ...fakeQazinhoApi('darwin'), focusDevice };
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...walked,
            live: { ...walked.live!, streamUrl: 'http://127.0.0.1:5000/t/w1' },
          },
        ],
      });

      const { result } = renderHook(() => useDeviceViewModel());

      expect(focusDevice).not.toHaveBeenCalled();

      act(() => {
        result.current.onFocus();
      });

      expect(focusDevice).toHaveBeenLastCalledWith({
        workspaceId: 'w1',
        isFocused: true,
      });

      act(() => {
        result.current.onUnfocus();
      });

      expect(focusDevice).toHaveBeenLastCalledWith({
        workspaceId: 'w1',
        isFocused: false,
      });
    });

    it('drops the detail once the run is over, even with the device still in focus', () => {
      const focusDevice = vi.fn(() => Promise.resolve());
      const walked = walkRun({ verdicts: ['passed'] });
      const streaming = { ...walked.live!, streamUrl: 'http://127.0.0.1:5000/t/w1' };

      window.qazinho = { ...fakeQazinhoApi('darwin'), focusDevice };
      useWorkspaceStore.setState({ workspaces: [{ ...walked, live: streaming }] });

      const { result } = renderHook(() => useDeviceViewModel());

      act(() => {
        result.current.onFocus();
      });
      act(() => {
        useWorkspaceStore.setState({
          workspaces: [{ ...walked, live: { ...streaming, isDone: true } }],
        });
      });

      expect(result.current.isFocused).toBe(true);
      expect(focusDevice).toHaveBeenLastCalledWith({
        workspaceId: 'w1',
        isFocused: false,
      });
    });

    it('does NOT ask for detail when the screen in focus is a screenshot', () => {
      const focusDevice = vi.fn(() => Promise.resolve());

      window.qazinho = { ...fakeQazinhoApi('darwin'), focusDevice };
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['passed'] })] });

      const { result } = renderHook(() => useDeviceViewModel());

      act(() => {
        result.current.onFocus();
      });

      expect(result.current.isFocused).toBe(true);
      expect(focusDevice).not.toHaveBeenCalled();
    });

    it('lets go of focus when the screen goes away', () => {
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['passed'] })] });

      const { result, rerender } = renderHook(() => useDeviceViewModel());

      act(() => {
        result.current.onFocus();
      });
      act(() => {
        useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
      });
      rerender();

      expect(result.current.isFocused).toBe(false);
    });
  });
});
