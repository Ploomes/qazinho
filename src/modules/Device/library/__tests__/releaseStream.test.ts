// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { releaseStream } from '@/modules/Device/library';

/** Uma imagem de transmissão na página, como o DeviceScreen a monta. */
function streaming() {
  const image = document.createElement('img');

  image.setAttribute('src', 'http://127.0.0.1:1/t/w');
  document.body.append(image);

  return image;
}

describe('releaseStream', () => {
  it('lets go of the connection once the image left the page', async () => {
    const image = streaming();
    const leave = releaseStream(image);

    expect(image.hasAttribute('src')).toBe(true);

    image.remove();
    leave();
    await Promise.resolve();

    expect(image.hasAttribute('src')).toBe(false);
  });

  /**
   * O StrictMode desmonta e monta cada ref uma vez em desenvolvimento, com a imagem ainda na
   * página: tirar o src ali deixava a tela do dispositivo vazia para sempre.
   */
  it('keeps the stream of an image still on the page', async () => {
    const image = streaming();

    releaseStream(image)();
    await Promise.resolve();

    expect(image.hasAttribute('src')).toBe(true);
    image.remove();
  });

  it('does nothing without an image', async () => {
    expect(() => {
      releaseStream(null)();
    }).not.toThrow();
    await Promise.resolve();
  });
});
