import { describe, expect, it } from 'vitest';
import { javaHomesOf } from '@/main/classes/builds/AppBuilder/library';

describe('javaHomesOf', () => {
  it("looks inside Android Studio's app on a Mac", () => {
    expect(javaHomesOf({ platform: 'darwin', home: '/Users/ana', env: {} })[0]).toBe(
      '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
    );
  });

  it('looks where the Windows installer puts Android Studio', () => {
    expect(
      javaHomesOf({
        platform: 'win32',
        home: 'C:\\Users\\Ana',
        env: { ProgramFiles: 'C:\\Program Files' },
      }),
    ).toContain('C:\\Program Files\\Android\\Android Studio\\jbr');
  });

  it('looks where Linux unpacks it, by hand or as a snap', () => {
    const homes = javaHomesOf({ platform: 'linux', home: '/home/ana', env: {} });

    expect(homes).toContain('/opt/android-studio/jbr');
    expect(homes).toContain('/home/ana/android-studio/jbr');
    expect(homes).toContain('/snap/android-studio/current/jbr');
  });
});
