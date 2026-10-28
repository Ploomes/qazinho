import type { IVaultCipher } from '@/main/types';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VariableVault } from '@/main/classes/storage/VariableVault';

/** Inverte o texto, para um teste distinguir um arquivo lacrado de um simples. */
function fakeCipher(isAvailable = true): IVaultCipher {
  return {
    isAvailable: () => isAvailable,
    encrypt: (plain) => Buffer.from([...plain].reverse().join('')),
    decrypt: (sealed) => [...sealed.toString()].reverse().join(''),
  };
}

async function vaultWith(cipher: IVaultCipher = fakeCipher()) {
  const file = join(await mkdtemp(join(tmpdir(), 'qazinho-variables-')), 'variables.bin');

  return { file, vault: new VariableVault({ file, cipher }) };
}

const PASSWORD = {
  kind: 'save',
  name: 'LOGIN_PASSWORD',
  description: 'The admin password on staging',
  value: 'Sup3r-s3cret!',
  from: null,
} as const;

describe('VariableVault', () => {
  it('seals a value on disk and lists only the name and what it holds', async () => {
    const { file, vault } = await vaultWith();

    expect(await vault.apply({ projectId: 'p-1', changes: [PASSWORD] })).toEqual({
      isSaved: true,
      variables: [
        { name: 'LOGIN_PASSWORD', description: 'The admin password on staging' },
      ],
    });
    expect(await readFile(file, 'utf8')).not.toContain('Sup3r-s3cret!');
    expect(JSON.stringify(await vault.list())).not.toContain('Sup3r-s3cret!');
  });

  it("hands a run one project's values, and only that project's", async () => {
    const { vault } = await vaultWith();

    await vault.apply({ projectId: 'p-1', changes: [PASSWORD] });
    await vault.apply({
      projectId: 'p-2',
      changes: [{ ...PASSWORD, value: 'other' }],
    });

    expect(await vault.valuesOf('p-1')).toEqual([
      {
        name: 'LOGIN_PASSWORD',
        description: 'The admin password on staging',
        value: 'Sup3r-s3cret!',
      },
    ]);
    expect(await vault.valuesOf('p-3')).toEqual([]);
  });

  it('keeps none of the changes when one breaks a rule', async () => {
    const { vault } = await vaultWith();

    expect(
      await vault.apply({
        projectId: 'p-1',
        changes: [PASSWORD, { ...PASSWORD, name: 'EMAIL', value: '' }],
      }),
    ).toEqual({ isSaved: false, failure: { reason: 'no-value', name: 'EMAIL' } });
    expect(await vault.list()).toEqual([]);
  });

  it('does NOT store a value without a keychain to seal it with', async () => {
    const { file, vault } = await vaultWith(fakeCipher(false));

    expect(await vault.apply({ projectId: 'p-1', changes: [PASSWORD] })).toEqual({
      isSaved: false,
      failure: { reason: 'no-keychain' },
    });
    await expect(readFile(file)).rejects.toThrow();
  });

  it('does NOT write over a file the keychain can no longer open', async () => {
    const { file, vault } = await vaultWith({
      ...fakeCipher(),
      decrypt: () => {
        throw new Error('The keychain said no.');
      },
    });

    await writeFile(file, 'sealed by another keychain');

    expect(await vault.apply({ projectId: 'p-1', changes: [PASSWORD] })).toEqual({
      isSaved: false,
      failure: { reason: 'no-keychain' },
    });
    expect(await readFile(file, 'utf8')).toBe('sealed by another keychain');
    expect(await vault.list()).toEqual([]);
  });

  it('gives a copied project the variables of the one it came from, their values too', async () => {
    const { vault } = await vaultWith();

    await vault.apply({ projectId: 'p-1', changes: [PASSWORD] });

    expect(await vault.copy({ from: 'p-1', to: 'p-2' })).toMatchObject({ isSaved: true });
    expect(await vault.valuesOf('p-2')).toEqual(await vault.valuesOf('p-1'));
  });

  it('does NOT copy to a project from one with no variables', async () => {
    const { vault } = await vaultWith();

    await vault.copy({ from: 'p-1', to: 'p-2' });

    expect(await vault.valuesOf('p-2')).toEqual([]);
  });

  it('forgets every variable of a project that is gone', async () => {
    const { vault } = await vaultWith();

    await vault.apply({ projectId: 'p-1', changes: [PASSWORD] });
    await vault.apply({ projectId: 'p-2', changes: [PASSWORD] });
    await vault.forget('p-1');

    expect((await vault.list()).map(({ projectId }) => projectId)).toEqual(['p-2']);
  });

  it('keeps both of two changes that arrive together', async () => {
    const { vault } = await vaultWith();

    await Promise.all([
      vault.apply({ projectId: 'p-1', changes: [PASSWORD] }),
      vault.apply({ projectId: 'p-1', changes: [{ ...PASSWORD, name: 'LOGIN_EMAIL' }] }),
    ]);

    expect(await vault.list()).toEqual([
      {
        projectId: 'p-1',
        variables: [
          { name: 'LOGIN_PASSWORD', description: 'The admin password on staging' },
          { name: 'LOGIN_EMAIL', description: 'The admin password on staging' },
        ],
      },
    ]);
  });
});
