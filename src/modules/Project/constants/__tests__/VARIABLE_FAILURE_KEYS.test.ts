import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { VARIABLE_FAILURE_KEYS } from '@/modules/Project/constants';

describe('VARIABLE_FAILURE_KEYS', () => {
  it('says every way a save can fail in words the QA reads, the name it broke on included', () => {
    for (const key of Object.values(VARIABLE_FAILURE_KEYS))
      expect(i18n.t(key, { name: 'LOGIN_EMAIL' })).not.toBe(key);

    expect(i18n.t(VARIABLE_FAILURE_KEYS.taken, { name: 'LOGIN_EMAIL' })).toContain(
      'LOGIN_EMAIL',
    );
  });

  it('tells a Linux QA where a keychain comes from', () => {
    expect(i18n.t(VARIABLE_FAILURE_KEYS['no-keychain'])).toContain('GNOME Keyring');
  });
});
