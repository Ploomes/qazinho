// @vitest-environment jsdom
import type { ISuiteChange } from '@/shared/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSuiteRequestPaneViewModel } from '@/modules/Automation/screens/Automation/components/SuiteRequestPane/hooks/useSuiteRequestPaneViewModel';

const render = (ask: ISuiteChange['ask']) =>
  renderHook(() =>
    useSuiteRequestPaneViewModel({
      change: { id: 'c-02', status: 'working', ask } as ISuiteChange,
      notes: [],
      agent: 'Claude Code',
      onStop: vi.fn(),
      onReview: vi.fn(),
      onDiscard: vi.fn(),
      onRetry: vi.fn(),
    }),
  ).result.current;

describe('useSuiteRequestPaneViewModel', () => {
  it("says what was asked in the QA's words, and where it goes", () => {
    expect(
      render({
        kind: 'write',
        text: 'The cart keeps its items.\nEven after a reload.',
        folder: 'tests/hc-1139',
        source: null,
      }),
    ).toMatchObject({
      eyebrow: 'New test',
      title: 'The cart keeps its items.',
      text: 'The cart keeps its items.\nEven after a reload.',
      from: '',
      where: 'In tests/hc-1139',
    });
  });

  it('names the plan case it automates, and leaves the place to the suite', () => {
    expect(
      render({
        kind: 'write',
        text: '',
        folder: '',
        source: {
          workspace: 'Checkout regression',
          id: 'TC-03',
          title: 'Cart survives a reload',
          goal: '',
          preconditions: '',
          steps: [],
        },
      }),
    ).toMatchObject({
      title: 'Cart survives a reload',
      text: '',
      from: 'From the case TC-03 · Cart survives a reload, in Checkout regression',
      where: 'Where the suite keeps tests like it',
    });
  });
});
