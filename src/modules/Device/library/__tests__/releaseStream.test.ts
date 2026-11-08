// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { releaseStream } from '@/modules/Device/library';

describe('releaseStream', () => {
  it('lets go of the connection only when the image leaves', () => {
    const image = document.createElement('img');

    image.setAttribute('src', 'http://127.0.0.1:1/t/w');

    const leave = releaseStream(image);

    expect(image.hasAttribute('src')).toBe(true);

    leave();

    expect(image.hasAttribute('src')).toBe(false);
  });

  it('does nothing without an image', () => {
    expect(() => {
      releaseStream(null)();
    }).not.toThrow();
  });
});
