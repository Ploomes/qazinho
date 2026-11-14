import { describe, expect, it } from 'vitest';
import { appNameOfManifest } from '@/main/classes/projects/AppNames/library';

describe('appNameOfManifest', () => {
  it('reads the Expo name first, then the display name, then the name', () => {
    expect(appNameOfManifest('{"expo":{"name":"Loja","slug":"loja-app"}}')).toBe('Loja');
    expect(appNameOfManifest('{"name":"LojaApp","displayName":"Loja"}')).toBe('Loja');
    expect(appNameOfManifest('{"name":"LojaApp"}')).toBe('LojaApp');
  });

  it('reads nothing from a broken file or one with no name', () => {
    expect(appNameOfManifest('{')).toBeNull();
    expect(appNameOfManifest('{"expo":{}}')).toBeNull();
  });
});
