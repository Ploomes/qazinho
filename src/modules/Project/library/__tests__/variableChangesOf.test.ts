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
          { key: 'n', name: 'TOKEN', description: ' API ', value: 'abc', from: null },
        ],
      }),
    ).toEqual([
      { kind: 'remove', name: 'LOGIN_PASSWORD' },
      { kind: 'save', name: 'TOKEN', description: 'API', value: 'abc', from: null },
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
      },
    ]);
  });
});
