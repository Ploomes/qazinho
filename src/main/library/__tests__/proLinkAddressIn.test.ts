import { describe, expect, it } from 'vitest';
import { proLinkAddressIn } from '@/main/library';

describe('proLinkAddressIn', () => {
  it('finds the link Windows passes after the app and its flags', () => {
    expect(
      proLinkAddressIn([
        'C:\\Program Files\\QAzinho\\QAzinho.exe',
        '--allow-file-access-from-files',
        'qazinho://open/?org=loja&project=p1&workspace=w1',
      ]),
    ).toBe('qazinho://open/?org=loja&project=p1&workspace=w1');
  });

  it('finds none in a start with no link', () => {
    expect(proLinkAddressIn(['/opt/QAzinho/qazinho', '--no-sandbox'])).toBeUndefined();
  });
});
