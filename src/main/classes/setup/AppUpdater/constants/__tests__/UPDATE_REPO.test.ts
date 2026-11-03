import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { UPDATE_REPO } from '@/main/classes/setup/AppUpdater/constants';

describe('UPDATE_REPO', () => {
  // O build grava no app de onde ele se atualiza; um token aponta para o mesmo lugar.
  it('names the repository the build publishes to', () => {
    const { publish } = parse(readFileSync('electron-builder.yml', 'utf8')) as {
      publish: { owner: string; repo: string };
    };

    expect({ owner: publish.owner, name: publish.repo }).toEqual(UPDATE_REPO);
  });
});
