import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { WebDriver } from '@/main/classes/devices/WebDriver';

const PAGE = `<!doctype html><html><body>
  <h1 id="title">Before</h1>
  <button onclick="document.getElementById('title').textContent='After'">Change</button>
</body></html>`;

const JPEG_START = Buffer.from([0xff, 0xd8]);

describe('the live device stream', () => {
  it('shows a windowless Chrome in the page as MJPEG over loopback', async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(PAGE);
    });

    await new Promise<void>((ready) => site.listen(4323, '127.0.0.1', ready));

    const live = new LiveStream();
    const driver = new WebDriver({
      url: 'http://127.0.0.1:4323/',
      profileDir: await mkdtemp(join(tmpdir(), 'qazinho-stream-')),
    });

    await live.start();
    await driver.open();

    const isStreaming = await driver.stream((jpeg) => {
      live.push({ workspaceId: 'w1', jpeg });
    });
    const url = live.urlFor('w1');

    expect(isStreaming).toBe(true);
    expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/[\w-]+\/w1$/);

    const response = await fetch(url ?? '');
    const reader = response.body?.getReader();

    expect(response.headers.get('content-type')).toContain('multipart/x-mixed-replace');

    await driver.act({ kind: 'click', target: 'Change', value: '' });

    let received = Buffer.alloc(0);

    while (received.indexOf(JPEG_START) === -1 && reader) {
      const chunk = await reader.read();

      if (chunk.done) break;

      received = Buffer.concat([received, Buffer.from(chunk.value)]);
    }

    expect(received.toString('latin1')).toContain('Content-Type: image/jpeg');
    expect(received.indexOf(JPEG_START)).toBeGreaterThan(-1);

    const stranger = await fetch(`${(url ?? '').replace(/\/[\w-]+\/w1$/, '/guess/w1')}`);

    expect(stranger.status).toBe(404);

    await reader?.cancel();
    await driver.close();
    live.close();
    site.close();
  });
});
