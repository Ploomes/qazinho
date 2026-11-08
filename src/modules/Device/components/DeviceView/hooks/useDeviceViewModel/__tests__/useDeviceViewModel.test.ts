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
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()], chatDevices: {} });
});

describe('useDeviceViewModel', () => {
  it('stays off and says so while no run has started', () => {
    const { result } = renderHook(() => useDeviceViewModel());

    expect(result.current.hasScreen).toBe(false);
    expect(result.current.hasControls).toBe(false);
    expect(result.current.hasState).toBe(false);
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

    it('offers no size while nothing is running, because there is no screen to size', () => {
      const { result } = renderHook(() => useDeviceViewModel());

      expect(result.current.hasScreen).toBe(false);
      expect(result.current.hasViewportPicker).toBe(false);
    });

    it('offers the size beside a live screen', () => {
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: [] })] });

      const { result } = renderHook(() => useDeviceViewModel());

      expect(result.current.hasScreen).toBe(true);
      expect(result.current.hasViewportPicker).toBe(true);
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

    it('keeps the size picked between runs', () => {
      const resizeDevice = vi.fn(() => Promise.resolve());

      window.qazinho = { ...fakeQazinhoApi('darwin'), resizeDevice };

      const { result } = renderHook(() => useDeviceViewModel());

      act(() => {
        result.current.onSelectViewport('phone');
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.viewportId).toBe('phone');
      expect(result.current.screenRatio).toBe(390 / 844);
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
    expect(result.current.doingLabel).toBe('2 of 6');
  });

  it('counts the step it is on in the language the QA reads', async () => {
    const walked = walkRun({ verdicts: ['passed'] });

    useWorkspaceStore.setState({ workspaces: [walked] });
    await i18n.changeLanguage('pt');

    const { result } = renderHook(() => useDeviceViewModel());

    expect(result.current.doingLabel).toBe('2 de 6');
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

  it("shows the address the agent's tab is on, not the one the run began at", () => {
    useAppStore.setState({
      projects: [
        {
          id: 'p1',
          name: 'Shop',
          targets: [{ id: 't1', kind: 'web', value: 'http://localhost:8000' }],
        },
      ] as never,
    });
    const walked = {
      ...walkRun({ verdicts: ['passed'] }),
      projectId: 'p1',
      targetId: 't1',
    };

    useWorkspaceStore.setState({ workspaces: [walked] });

    expect(renderHook(() => useDeviceViewModel()).result.current.urlText).toBe(
      'http://localhost:8000',
    );

    useWorkspaceStore.setState({
      workspaces: [
        {
          ...walked,
          live: { ...walked.live!, address: 'http://localhost:8000/templates/quotes' },
        },
      ],
    });

    expect(renderHook(() => useDeviceViewModel()).result.current.urlText).toBe(
      'http://localhost:8000/templates/quotes',
    );
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
    /** Uma foto velha e "parado" diziam menos que a run que já está em Runs. */
    it('leaves a run that ended to Runs, and offers to watch it', () => {
      const finished = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });

      useWorkspaceStore.setState({ workspaces: [{ ...finished, live: null }] });

      const { result } = renderHook(() => useDeviceViewModel());

      expect(result.current).toMatchObject({
        hasScreen: false,
        hasSteps: false,
        hasState: false,
      });
      expect(result.current.ended?.runsLabel).toBe('See in Runs');

      act(() => {
        result.current.ended?.onOpenRuns();
      });

      expect(useWorkspaceStore.getState().panelTab).toBe('runs');
    });

    it('offers nothing to go back to before the first run', () => {
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useDeviceViewModel());

      expect(result.current.ended).toBeNull();
      expect(result.current.hasSteps).toBe(false);
    });

    /** O fim da lista é o que importa numa run: passos pendentes empurravam o atual para fora. */
    it('lists only what a run reached, so the end of the list is the step it is on', () => {
      const walked = walkRun({ verdicts: ['passed'] });

      useWorkspaceStore.setState({
        workspaces: [{ ...walked, live: { ...walked.live!, doingIndex: 1 } }],
      });

      const { result } = renderHook(() => useDeviceViewModel());

      expect(
        result.current.sections.flatMap(({ rows }) => rows.map(({ verdict }) => verdict)),
      ).toEqual(['passed', 'running']);
      expect(result.current.steps).toHaveLength(6);
    });

    /** Uma run numera os passos dela: lidos contra o plano, o veredito caía na linha errada. */
    it('reads a run of one case against that case, not the whole plan', () => {
      const walked = walkRun({ verdicts: ['failed'] });

      useWorkspaceStore.setState({
        workspaces: [{ ...walked, live: { ...walked.live!, caseIds: ['TC-02'] } }],
      });

      const { result } = renderHook(() => useDeviceViewModel());

      expect(result.current.steps.map(({ action }) => action)).toEqual([
        'Add the product to the cart',
        'Leave the house number empty',
        'Pay with the test card',
      ]);
      expect(result.current.sections[0]?.rows).toMatchObject([
        { number: 1, action: 'Add the product to the cart', verdict: 'failed' },
      ]);
      expect(result.current.doingLabel).toBe('2 of 3');
    });

    /** A run acabou de começar: "aperte Rodar plano" seria mentira. */
    it('does NOT tell the QA to press run while a run is starting', () => {
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: [] })] });

      const { result } = renderHook(() => useDeviceViewModel());

      expect(result.current.sections).toEqual([]);
      expect(result.current.hasSteps).toBe(false);
    });

    /**
     * Uma exploração não tem plano: o painel dizia "passos 1 de 0" e mandava o QA apertar
     * Rodar plano.
     */
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
      expect(result.current.sections.map(({ title }) => title)).toEqual(['']);
      expect(result.current).toMatchObject({
        stepsWord: 'screens',
        doingLabel: '',
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
    it('hugs the screen of a browser and fills the height for a phone, empty or not', () => {
      expect(
        renderHook(() => useDeviceViewModel()).result.current.viewportClassName,
      ).toBe('device-view__viewport device-view__viewport--browser');

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

      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), planKind: 'mobile' }],
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
        '0:00',
      );

      useWorkspaceStore.setState({
        workspaces: [
          { ...walked, live: { ...walked.live!, elapsedSec: 75, costUsd: 0.042 } },
        ],
      });

      expect(renderHook(() => useDeviceViewModel()).result.current.elapsedLabel).toBe(
        '1:15',
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

  /**
   * O agente do chat conhece o app no navegador do QAzinho antes de planejar: o QA o
   * acompanha aqui, como acompanha uma run.
   */
  describe('the chat learning the app', () => {
    it('shows the chat browser with no run going, saying what it does and where it is', () => {
      useWorkspaceStore.setState({
        chatDevices: {
          w1: {
            streamUrl: 'http://127.0.0.1:5000/t/chat~w1',
            address: 'http://localhost:8000/templates/quotes',
          },
        },
      });

      const { result } = renderHook(() => useDeviceViewModel());

      expect(result.current).toMatchObject({
        hasScreen: true,
        stream: 'http://127.0.0.1:5000/t/chat~w1',
        hasState: true,
        stateText: 'learning the app',
        urlText: 'http://localhost:8000/templates/quotes',
        hasViewportPicker: false,
      });
    });

    it('lets a run take the screen over', () => {
      const walked = walkRun({ verdicts: ['passed'] });

      useWorkspaceStore.setState({
        workspaces: [{ ...walked, live: { ...walked.live!, streamUrl: 'http://run' } }],
        chatDevices: { w1: { streamUrl: 'http://chat', address: null } },
      });

      expect(renderHook(() => useDeviceViewModel()).result.current).toMatchObject({
        stream: 'http://run',
        stateText: 'running',
      });
    });
  });
});
