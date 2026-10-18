// @vitest-environment jsdom
import type { IRunSectionProps } from '@/modules/Chat/screens/Chat/components/RunSection/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRunSectionViewModel } from '@/modules/Chat/screens/Chat/components/RunSection/hooks/useRunSectionViewModel';

const section = (props: Partial<IRunSectionProps> = {}) =>
  renderHook(() =>
    useRunSectionViewModel({
      at: '09:41',
      title: 'Run r-01',
      facts: '3:45',
      countLabel: '2 messages',
      isLive: false,
      isExpanded: false,
      isExpandable: true,
      openLabel: null,
      onToggle: vi.fn(),
      onOpen: vi.fn(),
      children: null,
      ...props,
    }),
  ).result.current;

describe('useRunSectionViewModel', () => {
  describe('onToggle', () => {
    it('folds and unfolds a run that said something', () => {
      const onToggle = vi.fn();

      section({ onToggle }).onToggle();

      expect(onToggle).toHaveBeenCalledOnce();
      expect(section({ isExpanded: true })).toMatchObject({
        caret: '▾',
        isBodyShown: true,
      });
      expect(section()).toMatchObject({ caret: '▸', isBodyShown: false });
    });

    it('does NOT open a run that said nothing in the chat', () => {
      const onToggle = vi.fn();
      const view = section({ isExpandable: false, isExpanded: true, onToggle });

      view.onToggle();

      expect(onToggle).not.toHaveBeenCalled();
      expect(view).toMatchObject({ caret: '', isBodyShown: false });
    });
  });

  it('writes how long, how much and how many under the title, leaving out what is not known', () => {
    expect(section().facts).toBe('3:45 · 2 messages');
    expect(section({ facts: '', countLabel: '' }).facts).toBe('');
  });

  it('offers the report only once the run has one', () => {
    expect(section().hasOpen).toBe(false);
    expect(section({ openLabel: 'Open in Runs →' }).hasOpen).toBe(true);
  });

  it('marks the run that is still going', () => {
    expect(section({ isLive: true }).className).toBe('run-section run-section--live');
  });
});
