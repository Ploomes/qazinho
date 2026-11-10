// @vitest-environment jsdom
import type { IRunSectionProps } from '@/modules/Chat/screens/Chat/components/RunSection/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRunSectionViewModel } from '@/modules/Chat/screens/Chat/components/RunSection/hooks/useRunSectionViewModel';

const section = (props: Partial<IRunSectionProps> = {}) =>
  renderHook(() =>
    useRunSectionViewModel({
      at: '09:41',
      day: 'today',
      title: 'Run r-01',
      facts: '3:45',
      isLive: false,
      isExpanded: false,
      isExpandable: true,
      openLabel: null,
      activity: [],
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
        hasCaret: true,
        isBodyShown: true,
      });
      expect(section()).toMatchObject({ hasCaret: true, isBodyShown: false });
    });

    it('does NOT open a run that said nothing in the chat', () => {
      const onToggle = vi.fn();
      const view = section({ isExpandable: false, isExpanded: true, onToggle });

      view.onToggle();

      expect(onToggle).not.toHaveBeenCalled();
      expect(view).toMatchObject({ hasCaret: false, isBodyShown: false });
    });
  });

  it('writes when the run began and how long it took under the title', () => {
    expect(section().facts).toBe('today 09:41 · 3:45');
    expect(section({ facts: '' }).facts).toBe('today 09:41');
  });

  it('leaves out the day it does not know, and the time a run has not got yet', () => {
    expect(section({ day: '' }).facts).toBe('09:41 · 3:45');
    expect(section({ day: '', at: '', facts: '' }).facts).toBe('');
  });

  it('offers the report only once the run has one', () => {
    expect(section().hasOpen).toBe(false);
    expect(section({ openLabel: 'Open in Runs' }).hasOpen).toBe(true);
  });

  it('marks the run that is still going', () => {
    expect(section({ isLive: true }).className).toBe('run-section run-section--live');
  });

  it('tells what the agent is doing only while the run goes on', () => {
    const activity = [{ id: 1, text: 'Reading the screen', isBug: false }];

    expect(section({ isLive: true, activity }).hasActivity).toBe(true);
    expect(section({ isLive: false, activity }).hasActivity).toBe(false);
    expect(section({ isLive: true, activity: [] }).hasActivity).toBe(false);
  });
});
