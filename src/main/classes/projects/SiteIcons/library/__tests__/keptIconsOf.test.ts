import { describe, expect, it } from 'vitest';
import { keptIconsOf } from '@/main/classes/projects/SiteIcons/library';

describe('keptIconsOf', () => {
  it('keeps an icon and a miss, each with when it was looked for', () => {
    expect(
      keptIconsOf({
        'https://a.test': { icon: 'data:image/png;base64,AAAA', at: 1 },
        'https://b.test': { icon: null, at: 2 },
      }),
    ).toEqual({
      'https://a.test': { icon: 'data:image/png;base64,AAAA', at: 1 },
      'https://b.test': { icon: null, at: 2 },
    });
  });

  /** O arquivo é lido de volta para a página: nada ali vira outra coisa que uma imagem. */
  it('drops an entry that is not an image or has no date', () => {
    expect(
      keptIconsOf({
        'https://a.test': { icon: 'javascript:alert(1)', at: 1 },
        'https://b.test': { icon: 'data:image/png;base64,AAAA' },
        'https://c.test': 'data:image/png;base64,AAAA',
      }),
    ).toEqual({});
  });

  it('gives nothing for a file that is not an object', () => {
    expect(keptIconsOf(null)).toEqual({});
    expect(keptIconsOf([])).toEqual({});
    expect(keptIconsOf('x')).toEqual({});
  });
});
