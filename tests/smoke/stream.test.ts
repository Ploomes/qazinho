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

const COUNTER = `<!doctype html><html><body style="margin:0">
  <p id="count">0</p>
  <button onclick="count.textContent = String(Number(count.textContent) + 1)">Change</button>
</body></html>`;

/** Reads a JPEG's size off its start-of-frame marker. */
function sizeOf(jpeg: Buffer): { width: number; height: number } {
  for (let at = 2; at + 9 < jpeg.length; at += 2 + jpeg.readUInt16BE(at + 2)) {
    const marker = jpeg[at + 1] ?? 0;

    if (marker >= 0xc0 && marker <= 0xc3)
      return { width: jpeg.readUInt16BE(at + 7), height: jpeg.readUInt16BE(at + 5) };
  }

  return { width: 0, height: 0 };
}

/** Changes the page and waits for the frame that shows it, since a page standing still sends none. */
async function frameAfterChange(props: { driver: WebDriver; frames: Buffer[] }) {
  await new Promise((later) => setTimeout(later, 300));

  const from = props.frames.length;

  await props.driver.act({ kind: 'click', target: 'Change', value: '' });

  while (props.frames.length === from)
    await new Promise((later) => setTimeout(later, 50));

  return sizeOf(props.frames.at(-1) ?? Buffer.alloc(0));
}

describe('the live device stream', () => {
  it('shows a windowless Chrome in the page as MJPEG over loopback', async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(PAGE);
    });

    await new Promise<void>((ready) => site.listen(4335, '127.0.0.1', ready));

    const live = new LiveStream();
    const driver = new WebDriver({
      url: 'http://127.0.0.1:4335/',
      profileDir: await mkdtemp(join(tmpdir(), 'qazinho-stream-')),
    });

    await live.start();
    await driver.open();

    const isStreaming = await driver.stream((jpeg) => {
      live.push({ workspaceId: 'w1', jpeg, ratio: 1280 / 800 });
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

  /**
   * Left alone, the windowless Chrome is 1280×720 with the page emulated inside it, so a frame
   * showed 713 pixels of an 800-pixel page and cut its foot off. A page narrower than 500 pixels
   * still comes framed 500 wide: that is Chrome's own floor for a window, and the panel crops it.
   */
  it('frames the whole page at each window size', async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(COUNTER);
    });

    await new Promise<void>((ready) => site.listen(4336, '127.0.0.1', ready));

    const frames: Buffer[] = [];
    const driver = new WebDriver({
      url: 'http://127.0.0.1:4336/',
      profileDir: await mkdtemp(join(tmpdir(), 'qazinho-frame-')),
    });

    await driver.open();
    await driver.stream((jpeg) => {
      frames.push(jpeg);
    });

    expect(await frameAfterChange({ driver, frames })).toEqual({
      width: 1280,
      height: 800,
    });

    await driver.resize({ width: 820, height: 1180 });

    expect(await frameAfterChange({ driver, frames })).toEqual({
      width: 820,
      height: 1180,
    });

    await driver.resize({ width: 390, height: 844 });

    const narrow = await frameAfterChange({ driver, frames });

    expect(narrow.height).toBe(844);
    expect(narrow.width).toBeGreaterThanOrEqual(390);

    await driver.close();
    site.close();
  });

  /**
   * The window renders at the QA's pixel ratio, so the page and its evidence are sharp on a Retina
   * screen. The agent's glance is scaled back down: at 2x it would read four times the pixels.
   */
  it("renders at the display's pixel ratio, and the agent still reads the page at its size", async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(COUNTER);
    });

    await new Promise<void>((ready) => site.listen(4337, '127.0.0.1', ready));

    const folder = await mkdtemp(join(tmpdir(), 'qazinho-ratio-'));
    const driver = new WebDriver({
      url: 'http://127.0.0.1:4337/',
      profileDir: join(folder, 'profile'),
      pixelRatio: 2,
    });

    await driver.open();

    const shot = await driver.shoot(join(folder, 'shot.jpg'));
    const glance = await driver.glance();

    expect(sizeOf(Buffer.from(shot?.dataUrl.split(',')[1] ?? '', 'base64'))).toEqual({
      width: 2560,
      height: 1600,
    });
    expect(sizeOf(Buffer.from(glance?.data ?? '', 'base64'))).toEqual({
      width: 960,
      height: 600,
    });

    await driver.close();
    site.close();
  });

  /**
   * A frame at 2x costs about three times the CPU of one at 1x on a page that animates, so the
   * panel streams at 1x and only focus asks for the display's detail. A page standing still sends
   * no frame when the stream restarts, so focus hands over a still at once.
   */
  it('streams at full detail only while the QA watches up close', async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(COUNTER);
    });

    await new Promise<void>((ready) => site.listen(4338, '127.0.0.1', ready));

    const frames: Buffer[] = [];
    const driver = new WebDriver({
      url: 'http://127.0.0.1:4338/',
      profileDir: await mkdtemp(join(tmpdir(), 'qazinho-focus-')),
      pixelRatio: 2,
    });

    await driver.open();
    await driver.stream((jpeg) => {
      frames.push(jpeg);
    });

    expect(await frameAfterChange({ driver, frames })).toEqual({
      width: 1280,
      height: 800,
    });

    const before = frames.length;

    await driver.focus(true);

    expect(frames.length).toBeGreaterThan(before);
    expect(sizeOf(frames.at(-1) ?? Buffer.alloc(0))).toEqual({
      width: 2560,
      height: 1600,
    });
    expect(await frameAfterChange({ driver, frames })).toEqual({
      width: 2560,
      height: 1600,
    });

    await driver.focus(false);

    expect(await frameAfterChange({ driver, frames })).toEqual({
      width: 1280,
      height: 800,
    });

    await driver.close();
    site.close();
  });
});
