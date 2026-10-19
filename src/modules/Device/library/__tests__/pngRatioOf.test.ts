import { describe, expect, it } from 'vitest';
import { pngRatioOf } from '@/modules/Device/library';

/** A PNG data URL whose header says width × height; the pixels after it do not matter here. */
function png(width: number, height: number): string {
  const bytes = new Uint8Array(33);

  bytes.set([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82,
  ]);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);

  return `data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`;
}

describe('pngRatioOf', () => {
  it('reads a foldable as nearly square', () => {
    expect(pngRatioOf(png(1768, 2208))).toBeCloseTo(0.8, 2);
  });

  it('reads a tall phone as tall', () => {
    expect(pngRatioOf(png(1179, 2556))).toBeCloseTo(0.461, 2);
  });

  it('does NOT read a JPEG, nor a header cut short', () => {
    expect(pngRatioOf('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ')).toBeNull();
    expect(pngRatioOf('data:image/png;base64,iVBORw0KGgo=')).toBeNull();
  });
});
