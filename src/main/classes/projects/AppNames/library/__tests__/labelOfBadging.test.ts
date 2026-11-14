import { describe, expect, it } from 'vitest';
import { labelOfBadging } from '@/main/classes/projects/AppNames/library';

describe('labelOfBadging', () => {
  it('reads the label under the app icon', () => {
    expect(
      labelOfBadging(
        "package: name='dev.loja.app' versionCode='14'\napplication-label:'Loja'\napplication-label-pt:'Loja'\n",
      ),
    ).toBe('Loja');
  });

  it('falls back to the label on the application line', () => {
    expect(labelOfBadging("application: label='Contador' icon='res/mipmap/ic.png'")).toBe(
      'Contador',
    );
  });

  it('reads nothing from an apk with no label', () => {
    expect(labelOfBadging("package: name='dev.loja.app'")).toBeNull();
    expect(labelOfBadging("application-label:''")).toBeNull();
  });
});
