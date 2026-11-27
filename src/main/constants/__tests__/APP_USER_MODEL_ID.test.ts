import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { APP_USER_MODEL_ID } from '@/main/constants/APP_USER_MODEL_ID';

/** O que o electron-builder.yml diz do app que ele empacota. */
function builderConfig(): { appId: string; nsis: { guid: string } } {
  return parse(readFileSync('electron-builder.yml', 'utf8')) as {
    appId: string;
    nsis: { guid: string };
  };
}

describe('APP_USER_MODEL_ID', () => {
  /**
   * O atalho que o instalador do Windows cria leva o appId, e uma notificação só sai com o nome
   * do app quando o id dela é o mesmo.
   */
  it('is the id the build gives the app, so a notification comes under its name', () => {
    expect(builderConfig().appId).toBe(APP_USER_MODEL_ID);
  });

  /**
   * O instalador acha o app já instalado por uma chave no registro com esse GUID, que antes vinha
   * do appId. Com o appId trocado, um GUID novo instalaria um segundo app ao lado do primeiro em
   * vez de atualizá-lo.
   */
  it('keeps the installer GUID the app was first installed under', () => {
    expect(builderConfig().nsis.guid).toBe('88bc01ff-4150-5ea6-a5f0-2d7bad89aaa4');
  });
});
