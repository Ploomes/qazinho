import { describe, expect, it } from 'vitest';
import { imageExtensionOf } from '@/main/library';

describe('imageExtensionOf', () => {
  it("names a phone's PNG a PNG, whatever the file it came from was called", () => {
    expect(imageExtensionOf(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe(
      'png',
    );
  });

  it("names Chrome's JPEG a JPEG", () => {
    expect(imageExtensionOf(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpg');
  });

  it('takes too few bytes for a JPEG rather than failing', () => {
    expect(imageExtensionOf(Buffer.from([0x89]))).toBe('jpg');
  });
});
