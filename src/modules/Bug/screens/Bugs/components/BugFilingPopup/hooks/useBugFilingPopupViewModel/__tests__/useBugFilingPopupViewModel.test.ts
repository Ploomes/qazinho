// @vitest-environment jsdom
import type { IBugFiling } from '@/modules/Bug/types';
import type { BugFiling } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBugFilingPopupViewModel } from '@/modules/Bug/screens/Bugs/components/BugFilingPopup/hooks';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useSettingsStore } from '@/store';

const BUG = walkRun({ verdicts: ['passed', 'failed'] }).bugs[0]!;

const TO_JIRA: IBugFiling = {
  filingId: 'f-1',
  bugId: BUG.id,
  target: { tracker: 'jira', project: 'SHOP' },
  story: 'SHOP-12',
  shots: 2,
  steps: [
    { row: 'ready', state: 'done' },
    { row: 'issue', state: 'working' },
    { row: 'screens', state: 'pending' },
    { row: 'video', state: 'pending' },
    { row: 'link', state: 'pending' },
  ],
  result: null,
};

const FILED: BugFiling = {
  isFiled: true,
  issue: {
    tracker: 'jira',
    key: 'SHOP-57',
    url: 'https://acme.atlassian.net/browse/SHOP-57',
    at: '2026-10-22T12:00:00.000Z',
  },
  missed: [],
  linked: 'SHOP-12',
};

function popup(filing: IBugFiling) {
  const onClose = vi.fn();
  const onRetry = vi.fn();
  const rendered = renderHook(() =>
    useBugFilingPopupViewModel({ filing, bug: BUG, onClose, onRetry }),
  );

  return { ...rendered, onClose, onRetry };
}

beforeEach(() => {
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    copyShot: vi.fn().mockResolvedValue(true),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
  vi.restoreAllMocks();
});

describe('useBugFilingPopupViewModel', () => {
  describe('rows', () => {
    it('lists each step in words, where the bug goes and the story it links to', () => {
      const { result } = popup(TO_JIRA);

      expect(result.current.title).toBe(`Sending ${BUG.id} to Jira`);
      expect(result.current.rows).toEqual([
        { key: 'ready', label: 'Get the evidence ready', state: 'done' },
        { key: 'issue', label: 'Write the issue in SHOP', state: 'active' },
        { key: 'screens', label: 'Attach 2 screens', state: 'pending' },
        { key: 'video', label: 'Attach the video', state: 'pending' },
        { key: 'link', label: 'Link it to SHOP-12', state: 'pending' },
      ]);
      expect(result.current.actions).toEqual([]);
    });
  });

  describe('once filed', () => {
    it('names the issue and opens it, closing on its own when nothing is left to tell', () => {
      const opened = vi.spyOn(window, 'open').mockReturnValue(null);
      const { result } = popup({ ...TO_JIRA, result: FILED });

      expect(result.current.tone).toBe('connected');
      expect(result.current.title).toBe('Filed as SHOP-57');
      expect(result.current.subtitle).toBe('In SHOP. The bug keeps the link.');
      expect(result.current.isKept).toBe(false);
      expect(result.current.actions.find(({ key }) => key === 'open')?.label).toBe(
        'View in Jira',
      );

      act(() => {
        result.current.actions.find(({ key }) => key === 'open')?.onClick();
      });

      expect(opened).toHaveBeenCalledWith(FILED.issue.url, '_blank', 'noreferrer');
    });

    it('stays to tell what Jira did not take, and the link it did not make', () => {
      const { result } = popup({
        ...TO_JIRA,
        result: { ...FILED, missed: ['BUG-01 clip.mp4'], linked: null },
      });

      expect(result.current.hint).toBe(
        'Jira did not take: BUG-01 clip.mp4. Jira did not link it to SHOP-12.',
      );
      expect(result.current.isKept).toBe(true);
    });

    it('copies the screen to paste in a GitHub issue, and says it did', async () => {
      const { result } = popup({
        ...TO_JIRA,
        target: { tracker: 'github', owner: 'acme', name: 'shop' },
        story: null,
        steps: [
          { row: 'ready', state: 'done' },
          { row: 'issue', state: 'done' },
        ],
        result: {
          ...FILED,
          issue: { ...FILED.issue, tracker: 'github', key: '#42' },
          linked: null,
        },
      });

      expect(result.current.hint).toMatch(/paste it in a comment/);
      expect(result.current.isKept).toBe(true);
      expect(result.current.actions.map(({ key }) => key)).toEqual([
        'done',
        'copy',
        'open',
      ]);

      act(() => {
        result.current.actions.find(({ key }) => key === 'copy')?.onClick();
      });

      await waitFor(() => {
        expect(result.current.actions.find(({ key }) => key === 'copy')?.label).toBe(
          'Copied',
        );
      });
      expect(window.qazinho.copyShot).toHaveBeenCalledWith({
        file: BUG.shots.find(({ isBad }) => isBad)?.file,
        src: BUG.shots.find(({ isBad }) => isBad)?.src,
      });
    });
  });

  describe('once failed', () => {
    it('shows what the tracker said, and tries again', () => {
      const { result, onRetry } = popup({
        ...TO_JIRA,
        result: { isFiled: false, failure: 'rejected', said: 'Component/s is required.' },
      });

      expect(result.current.tone).toBe('failed');
      expect(result.current.subtitle).toBe(
        'Jira refused the issue. This is what it said:',
      );
      expect(result.current.detail).toEqual({
        text: 'Component/s is required.',
        isCommand: false,
      });

      act(() => {
        result.current.actions.find(({ key }) => key === 'retry')?.onClick();
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('sends the QA to the integrations when the tracker refused the access', () => {
      useAppStore.setState({ screen: 'workspace' });

      const { result, onClose } = popup({
        ...TO_JIRA,
        result: { isFiled: false, failure: 'unauthorized', said: '' },
      });

      expect(result.current.detail).toBeNull();

      act(() => {
        result.current.actions.find(({ key }) => key === 'integrations')?.onClick();
      });

      expect(useSettingsStore.getState().tab).toBe('integrations');
      expect(useAppStore.getState().screen).toBe('settings');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
