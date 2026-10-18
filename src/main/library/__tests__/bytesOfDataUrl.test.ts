import { describe, expect, it } from 'vitest';
import { bytesOfDataUrl } from '@/main/library';

describe('bytesOfDataUrl', () => {
  it('gives back the bytes a screenshot travelled as', () => {
    expect(bytesOfDataUrl('data:image/jpeg;base64,/9j/')).toEqual(
      Buffer.from([0xff, 0xd8, 0xff]),
    );
  });

  it('gives nothing for a data URL that is not base64, or for anything else', () => {
    expect(bytesOfDataUrl('data:text/plain,hello')).toBeNull();
    expect(bytesOfDataUrl('/Users/qa/.ssh/id_rsa')).toBeNull();
    expect(bytesOfDataUrl('')).toBeNull();
  });
});
