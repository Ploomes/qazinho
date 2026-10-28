import { describe, expect, it } from 'vitest';
import { imageRatioOf } from '@/modules/Device/library';

const toUrl = (mime: string, bytes: number[]) =>
  `data:${mime};base64,${btoa(String.fromCharCode(...bytes))}`;

/**
 * A assinatura e o IHDR de um PNG, dizendo largura × altura; os pixels depois não
 * importam aqui.
 */
function png(width: number, height: number): number[] {
  const bytes = new Uint8Array(33);

  bytes.set([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82,
  ]);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);

  return [...bytes];
}

/**
 * Um JPEG como o simctl escreve: um segmento Exif primeiro, depois o frame com o tamanho.
 */
function jpeg(width: number, height: number): number[] {
  const exif = [0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
  const frame = [
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    height >> 8,
    height & 255,
    width >> 8,
    width & 255,
    3,
  ];

  return [0xff, 0xd8, ...exif, ...frame, ...Array<number>(12).fill(0)];
}

describe('imageRatioOf', () => {
  it('reads a foldable PNG as nearly square', () => {
    expect(imageRatioOf(toUrl('image/png', png(1768, 2208)))).toBeCloseTo(0.8, 2);
  });

  it('reads an iPhone JPEG past its Exif, even when its data URL says PNG', () => {
    expect(imageRatioOf(toUrl('image/png', jpeg(1206, 2622)))).toBeCloseTo(0.46, 2);
  });

  it('does NOT make a size out of bytes it cannot read', () => {
    expect(imageRatioOf(toUrl('image/png', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))).toBeNull();
    expect(imageRatioOf('data:image/png;base64,iVBORw0KGgo=')).toBeNull();
    expect(imageRatioOf('not a data url')).toBeNull();
  });
});
