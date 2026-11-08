import type { IVariableDraft } from '@/modules/Project/types';
import { describe, expect, it } from 'vitest';
import { variableChangesOf } from '@/modules/Project/library';

const SAVED = [
  { name: 'LOGIN_EMAIL', description: 'The admin' },
  { name: 'LOGIN_PASSWORD', description: 'Its password' },
];

const kept = (name: string, change: Partial<IVariableDraft> = {}): IVariableDraft => ({
  key: name,
  name,
  description: SAVED.find((one) => one.name === name)?.description ?? '',
  value: '',
  from: name,
  isSecret: true,
  ...change,
});

describe('variableChangesOf', () => {
  it('changes nothing when the drafts are the saved variables', () => {
    expect(
      variableChangesOf({
        saved: SAVED,
        drafts: [kept('LOGIN_EMAIL'), kept('LOGIN_PASSWORD')],
      }),
    ).toEqual([]);
  });

  it('removes a variable the QA took out, before it saves anything', () => {
    expect(
      variableChangesOf({
        saved: SAVED,
        drafts: [
          kept('LOGIN_EMAIL'),
          {
            key: 'n',
            name: 'TOKEN',
            description: ' API ',
            value: 'abc',
            from: null,
            isSecret: null,
          },
        ],
      }),
    ).toEqual([
      { kind: 'remove', name: 'LOGIN_PASSWORD' },
      {
        kind: 'save',
        name: 'TOKEN',
        description: 'API',
        value: 'abc',
        from: null,
        isSecret: true,
      },
    ]);
  });

  it('renames and redescribes a saved variable, keeping its value', () => {
    expect(
      variableChangesOf({
        saved: SAVED,
        drafts: [
          kept('LOGIN_EMAIL', { name: 'ADMIN_EMAIL', description: 'The owner' }),
          kept('LOGIN_PASSWORD'),
        ],
      }),
    ).toEqual([
      {
        kind: 'save',
        name: 'ADMIN_EMAIL',
        description: 'The owner',
        value: null,
        from: 'LOGIN_EMAIL',
        isSecret: true,
      },
    ]);
  });

  it('replaces only the value the QA typed again', () => {
    expect(
      variableChangesOf({
        saved: SAVED,
        drafts: [kept('LOGIN_EMAIL'), kept('LOGIN_PASSWORD', { value: 'new one' })],
      }),
    ).toEqual([
      {
        kind: 'save',
        name: 'LOGIN_PASSWORD',
        description: 'Its password',
        value: 'new one',
        from: 'LOGIN_PASSWORD',
        isSecret: true,
      },
    ]);
  });

  it('saves a variable the QA said is no secret, its value kept', () => {
    expect(
      variableChangesOf({
        saved: SAVED,
        drafts: [kept('LOGIN_EMAIL', { isSecret: false }), kept('LOGIN_PASSWORD')],
      }),
    ).toEqual([
      {
        kind: 'save',
        name: 'LOGIN_EMAIL',
        description: 'The admin',
        value: null,
        from: 'LOGIN_EMAIL',
        isSecret: false,
      },
    ]);
  });

  it('follows the name of a new variable the QA did not mark either way', () => {
    expect(
      variableChangesOf({
        saved: [],
        drafts: [
          {
            key: 'n',
            name: 'SHOP_EMAIL',
            description: '',
            value: 'qa@shop.test',
            from: null,
            isSecret: null,
          },
        ],
      }),
    ).toMatchObject([{ name: 'SHOP_EMAIL', isSecret: false }]);
  });
});
