import { describe, expect, it } from 'vitest';
import { projectTargetsOf } from '@/modules/Assistant/library';

const labelOf = (kind: string) => kind.toUpperCase();

describe('projectTargetsOf', () => {
  it('takes a web address and app files as the targets, in a fixed order', () => {
    expect(
      projectTargetsOf({
        values: { ios: '/a/Loja.app', web: 'http://localhost:3000' },
        labelOf,
      }),
    ).toEqual({
      isOk: true,
      targets: [
        { id: 't-web', kind: 'web', label: 'WEB', value: 'http://localhost:3000' },
        { id: 't-ios', kind: 'ios', label: 'IOS', value: '/a/Loja.app' },
      ],
    });
  });

  it('does NOT take text that is not a web address', () => {
    expect(projectTargetsOf({ values: { web: 'a shop' }, labelOf })).toEqual({
      isOk: false,
      text: '"a shop" is not a web address.',
    });
  });

  it('asks for a target when every one is empty', () => {
    expect(projectTargetsOf({ values: { web: '', android: '' }, labelOf })).toMatchObject(
      {
        isOk: false,
      },
    );
  });
});
