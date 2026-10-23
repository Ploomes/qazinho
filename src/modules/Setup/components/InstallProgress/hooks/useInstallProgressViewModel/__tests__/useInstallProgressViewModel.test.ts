// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { INSTALL_PROGRESS } from '@/modules/Setup/components/InstallProgress/constants';
import { useInstallProgressViewModel } from '@/modules/Setup/components/InstallProgress/hooks/useInstallProgressViewModel';

const FAILED = {
  phase: 'failed' as const,
  failure: { reason: 'said' as const, text: 'EACCES' },
  command: 'npm install -g x',
  isFix: false,
};

afterEach(() => {
  vi.useRealTimers();
});

describe('useInstallProgressViewModel', () => {
  describe('segments', () => {
    it('fills the commands that ran and marks the one running', () => {
      const { result } = renderHook(() =>
        useInstallProgressViewModel({
          state: { phase: 'installing', stage: 3, stages: 4, line: '==> Pouring' },
          onRetry: vi.fn(),
        }),
      );

      expect(result.current.segments.map(({ fill }) => fill)).toEqual([
        'done',
        'done',
        'current',
        'todo',
      ]);
      expect(result.current.label).toBe('installing · step 3 of 4');
      expect(result.current.line).toBe('==> Pouring');
    });

    it('draws no bar once the install ended', () => {
      const { result } = renderHook(() =>
        useInstallProgressViewModel({ state: { phase: 'installed' }, onRetry: vi.fn() }),
      );

      expect(result.current.segments).toEqual([]);
      expect(result.current.label).toBe('installed');
    });
  });

  describe('onCopy', () => {
    it('puts the command on the clipboard and says so for a moment', async () => {
      vi.useFakeTimers();
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });
      const { result } = renderHook(() =>
        useInstallProgressViewModel({ state: FAILED, onRetry: vi.fn() }),
      );

      await act(() => result.current.onCopy());

      expect(writeText).toHaveBeenCalledWith('npm install -g x');
      expect(result.current.copyLabel).toBe('Copied');

      act(() => {
        vi.advanceTimersByTime(INSTALL_PROGRESS.copiedMs);
      });

      expect(result.current.copyLabel).toBe('Copy');
    });

    it('does NOT copy anything while the install is still running', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });
      const { result } = renderHook(() =>
        useInstallProgressViewModel({
          state: { phase: 'installing', stage: 1, stages: 1, line: '' },
          onRetry: vi.fn(),
        }),
      );

      await act(() => result.current.onCopy());

      expect(writeText).not.toHaveBeenCalled();
    });
  });

  describe('commandLabel', () => {
    it('asks the QA to run the fix the command suggested, then try again', () => {
      const { result } = renderHook(() =>
        useInstallProgressViewModel({
          state: { ...FAILED, command: 'sudo chown -R qa /opt/x', isFix: true },
          onRetry: vi.fn(),
        }),
      );

      expect(result.current.command).toBe('sudo chown -R qa /opt/x');
      expect(result.current.commandLabel).toBe('run this in a terminal, then try again');
    });

    it('offers the install itself when there is no fix to suggest', () => {
      const { result } = renderHook(() =>
        useInstallProgressViewModel({ state: FAILED, onRetry: vi.fn() }),
      );

      expect(result.current.commandLabel).toBe('or run it yourself in a terminal');
    });
  });
});
