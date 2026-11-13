import type { IProject } from '@/modules/Project/types';
import { describe, expect, it } from 'vitest';
import { withNameSettled } from '@/store/AppStore/library';

const PENDING: IProject = {
  id: 'p-1',
  name: 'Novo projeto',
  targets: [],
  repositories: [],
  isNamePending: true,
};

describe('withNameSettled', () => {
  it('stops waiting for the app name once the QA renamed the project', () => {
    expect(
      withNameSettled({ before: PENDING, after: { ...PENDING, name: 'Loja' } }),
    ).toEqual({ id: 'p-1', name: 'Loja', targets: [], repositories: [] });
  });

  it('keeps waiting when anything but the name changed', () => {
    const after = {
      ...PENDING,
      targets: [
        { id: 't-web', kind: 'web' as const, label: 'Web', value: 'https://a.test' },
      ],
    };

    expect(withNameSettled({ before: PENDING, after })).toBe(after);
  });

  it('keeps a new project waiting, since there was no name before it', () => {
    expect(withNameSettled({ before: undefined, after: PENDING })).toBe(PENDING);
  });
});
