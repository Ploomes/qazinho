// Transparent WebM (VP9 + alpha BlockAdditional) encoder for the Estagiário moods
async function encodeAlphaWebM(drawFn, size, frames, fps) {
  const W = size,
    H = size,
    codec = 'vp09.00.10.08';
  const cfg = {
    codec,
    width: W,
    height: H,
    bitrate: 10e6,
    framerate: fps,
    latencyMode: 'quality',
  };
  const color = [],
    alpha = [];
  const mk = (arr) =>
    new VideoEncoder({
      output: (ch) => {
        const b = new Uint8Array(ch.byteLength);
        ch.copyTo(b);
        arr.push({ key: ch.type === 'key', data: b, ts: ch.timestamp });
      },
      error: (e) => {
        throw e;
      },
    });
  const ec = mk(color),
    ea = mk(alpha);
  ec.configure(cfg);
  ea.configure(cfg);
  const cv = new OffscreenCanvas(W, H),
    c = cv.getContext('2d', { willReadFrequently: true });
  const n = W * H,
    q = n / 4;
  const yuv = new Uint8Array(n * 1.5),
    ay = new Uint8Array(n * 1.5);
  ay.fill(128, n);
  for (let i = 0; i < frames; i++) {
    drawFn(c, i / frames);
    const d = c.getImageData(0, 0, W, H).data;
    // un-premultiply fill: transparent pixels take lime to avoid fringes
    for (let p = 0, k = 0; p < n; p++, k += 4) {
      let r = d[k],
        g = d[k + 1],
        b = d[k + 2];
      const a = d[k + 3];
      if (a === 0) {
        r = 198;
        g = 244;
        b = 50;
      }
      yuv[p] = (16 + (65.738 * r + 129.057 * g + 25.064 * b) / 256) | 0;
      ay[p] = a;
    }
    for (let y = 0; y < H / 2; y++)
      for (let x = 0; x < W / 2; x++) {
        let r = 0,
          g = 0,
          b = 0;
        for (const [dx, dy] of [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ]) {
          const k = ((2 * y + dy) * W + 2 * x + dx) * 4;
          if (d[k + 3] === 0) {
            r += 198;
            g += 244;
            b += 50;
          } else {
            r += d[k];
            g += d[k + 1];
            b += d[k + 2];
          }
        }
        r /= 4;
        g /= 4;
        b /= 4;
        const j = y * (W / 2) + x;
        yuv[n + j] = (128 + (-37.945 * r - 74.494 * g + 112.439 * b) / 256) | 0;
        yuv[n + q + j] = (128 + (112.439 * r - 94.154 * g - 18.285 * b) / 256) | 0;
      }
    const ts = Math.round((i * 1e6) / fps),
      key = i % fps === 0;
    const f1 = new VideoFrame(yuv, {
      format: 'I420',
      codedWidth: W,
      codedHeight: H,
      timestamp: ts,
      colorSpace: {
        primaries: 'bt709',
        transfer: 'bt709',
        matrix: 'smpte170m',
        fullRange: false,
      },
    });
    const f2 = new VideoFrame(ay, {
      format: 'I420',
      codedWidth: W,
      codedHeight: H,
      timestamp: ts,
    });
    ec.encode(f1, { keyFrame: key });
    ea.encode(f2, { keyFrame: key });
    f1.close();
    f2.close();
    if (ec.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 0));
  }
  await ec.flush();
  await ea.flush();
  return mux(color, alpha, W, H, frames / fps);
}

function mux(color, alpha, W, H, durSec) {
  const enc = new TextEncoder();
  const idB = (id) => {
    const a = [];
    let v = id;
    while (v > 0) {
      a.unshift(v & 255);
      v = Math.floor(v / 256);
    }
    return a;
  };
  const sz = (n) => {
    const a = [];
    for (let i = 7; i >= 0; i--) a.push(Math.floor(n / 2 ** (8 * i)) & 255);
    a[0] |= 0x01;
    return a;
  }; // 8-byte size
  const cat = (parts) => {
    let L = 0;
    for (const p of parts) L += p.length;
    const o = new Uint8Array(L);
    let off = 0;
    for (const p of parts) {
      o.set(p, off);
      off += p.length;
    }
    return o;
  };
  const el = (id, payload) =>
    cat([new Uint8Array(idB(id)), new Uint8Array(sz(payload.length)), payload]);
  const uint = (id, v) => {
    const a = [];
    do {
      a.unshift(v & 255);
      v = Math.floor(v / 256);
    } while (v > 0);
    return el(id, new Uint8Array(a));
  };
  const sint16 = (v) => [(v >> 8) & 255, v & 255];
  const str = (id, s) => el(id, enc.encode(s));
  const flt = (id, v) => {
    const b = new ArrayBuffer(8);
    new DataView(b).setFloat64(0, v);
    return el(id, new Uint8Array(b));
  };
  const header = el(
    0x1a45dfa3,
    cat([
      uint(0x4286, 1),
      uint(0x42f7, 1),
      uint(0x42f2, 4),
      uint(0x42f3, 8),
      str(0x4282, 'webm'),
      uint(0x4287, 4),
      uint(0x4285, 2),
    ]),
  );
  const info = el(
    0x1549a966,
    cat([
      uint(0x2ad7b1, 1000000),
      str(0x4d80, 'qazinho'),
      str(0x5741, 'qazinho'),
      flt(0x4489, durSec * 1000),
    ]),
  );
  const tracks = el(
    0x1654ae6b,
    el(
      0xae,
      cat([
        uint(0xd7, 1),
        uint(0x73c5, 1),
        uint(0x83, 1),
        str(0x86, 'V_VP9'),
        el(0xe0, cat([uint(0xb0, W), uint(0xba, H), uint(0x53c0, 1)])),
      ]),
    ),
  );
  const groups = [];
  let prevMs = 0;
  for (let i = 0; i < color.length; i++) {
    const ms = Math.round(color[i].ts / 1000);
    const block = el(
      0xa1,
      cat([new Uint8Array([0x81, ...sint16(ms), 0x00]), color[i].data]),
    );
    const parts = [block];
    if (alpha[i])
      parts.push(el(0x75a1, el(0xa6, cat([uint(0xee, 1), el(0xa5, alpha[i].data)]))));
    if (!color[i].key) {
      const rel = prevMs - ms;
      parts.push(el(0xfb, new Uint8Array(sint16(rel & 0xffff))));
    }
    groups.push(el(0xa0, cat(parts)));
    prevMs = ms;
  }
  const cluster = el(0x1f43b675, cat([uint(0xe7, 0), ...groups]));
  const segment = el(0x18538067, cat([info, tracks, cluster]));
  return new Blob([header, segment], { type: 'video/webm' });
}
