import { describe, expect, it } from 'vitest';
import { mjpegPart } from '@/main/classes/devices/LiveStream/library';

describe('mjpegPart', () => {
  it('frames the image with its boundary, type and exact length', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const part = mjpegPart({ boundary: 'b', jpeg, at: 1, ratio: 1 }).toString('latin1');

    expect(
      part.startsWith('--b\r\nContent-Type: image/jpeg\r\nContent-Length: 4\r\n'),
    ).toBe(true);
    expect(part.endsWith('\r\n\r\n\xff\xd8\xff\xd9\r\n')).toBe(true);
  });

  /**
   * A janela do gravador põe cada frame no vídeo da run pelo momento em que foi
   * capturado, e corta uma página do tamanho de um celular da janela mais larga que o
   * Chrome mantém; um <img> pula as duas linhas.
   */
  it('says when the frame was captured and the shape of the screen it shows', () => {
    const part = mjpegPart({
      boundary: 'b',
      jpeg: Buffer.from([0xff, 0xd9]),
      at: 1_760_000_000_123,
      ratio: 0.4621,
    }).toString('latin1');

    expect(part).toContain('\r\nX-Captured-At: 1760000000123\r\n');
    expect(part).toContain('\r\nX-Screen-Ratio: 0.4621\r\n\r\n');
  });
});
