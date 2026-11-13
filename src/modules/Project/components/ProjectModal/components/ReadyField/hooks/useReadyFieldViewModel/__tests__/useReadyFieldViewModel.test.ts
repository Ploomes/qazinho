// @vitest-environment jsdom
import type { JiraStatusList } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useReadyFieldViewModel } from '@/modules/Project/components/ProjectModal/components/ReadyField/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

function listing(list: JiraStatusList) {
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listJiraStatuses: () => Promise.resolve(list),
  };
}

const LISTED: JiraStatusList = {
  isListed: true,
  statuses: [
    { name: 'To Do', category: 'new' },
    { name: 'In Progress', category: 'indeterminate' },
    { name: 'Ready for QA', category: 'indeterminate' },
    { name: 'Done', category: 'done' },
  ],
};

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useReadyFieldViewModel', () => {
  it('offers the statuses of the Jira site, with the ones the project counts turned on', async () => {
    listing(LISTED);

    const { result } = renderHook(() =>
      useReadyFieldViewModel({ statuses: ['ready for qa'], onChange: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.options.map(({ name, isOn }) => [name, isOn])).toEqual([
      ['To Do', false],
      ['In Progress', false],
      ['Ready for QA', true],
      ['Done', false],
    ]);
  });

  it('turns a status on and off', async () => {
    listing(LISTED);

    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      (statuses: string[]) => useReadyFieldViewModel({ statuses, onChange }),
      { initialProps: ['Ready for QA'] },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.onToggle('Done');
    });

    expect(onChange).toHaveBeenLastCalledWith(['Ready for QA', 'Done']);

    rerender(['Ready for QA', 'Done']);

    act(() => {
      result.current.onToggle('ready for qa');
    });

    expect(onChange).toHaveBeenLastCalledWith(['Done']);
  });

  /** Um status que alguém renomeou no Jira continua à vista, para o QA poder tirá-lo. */
  it('keeps showing a status the project counts that the site no longer lists', async () => {
    listing(LISTED);

    const { result } = renderHook(() =>
      useReadyFieldViewModel({ statuses: ['Em teste'], onChange: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.options.at(-1)).toMatchObject({ name: 'Em teste', isOn: true });
  });

  it('says why Jira did not list its statuses', async () => {
    listing({ isListed: false, failure: 'unreachable' });

    const { result } = renderHook(() =>
      useReadyFieldViewModel({ statuses: [], onChange: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.failure).toBe(
        'Jira is out of reach from this machine. Check the network.',
      );
    });
  });

  it('filters a long list by what the QA types, keeping the ones turned on', async () => {
    listing({
      isListed: true,
      statuses: Array.from({ length: 14 }, (_, index) => ({
        name: `Status ${String(index + 1)}`,
        category: 'indeterminate' as const,
      })),
    });

    const { result } = renderHook(() =>
      useReadyFieldViewModel({ statuses: ['Status 2'], onChange: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.hasFilter).toBe(true);
    });

    act(() => {
      result.current.onQuery('13');
    });

    expect(result.current.options.map(({ name }) => name)).toEqual([
      'Status 2',
      'Status 13',
    ]);
  });
});
