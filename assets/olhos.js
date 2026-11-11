// QAzinho — renderizador do personagem (tela retangular com olhos) e do ícone. Sucessor do antena.js.
// Quadro 1024×1024.
//   <qz-olhos mood="bug" size="160"></qz-olhos>              personagem animado (loop)
//   <qz-olhos mood="neutro" forma="icone" size="128"></qz-olhos> ícone do app (quadrado)
//   atributos extras: parado (quadro fixo) · tinta="#16150f" (cor dos sinais fora da tela)
//   QZOlhos.drawFrame(ctx, px, mood, t, {forma, bg, tinta})  t de 0 a 1 dentro do loop
(function () {
  const TAU = Math.PI * 2,
    sin = Math.sin;
  const SINAL = '#ffd23f';
  const SQ = new Path2D(
    'M924 512L923.9 615.2L923.7 648.2L923.3 672.1L922.7 691.5L922 708.2L921.1 722.9L920 736.1L918.8 748.1L917.4 759.2L915.8 769.6L914.1 779.2L912.2 788.2L910.1 796.8L907.8 804.8L905.4 812.4L902.8 819.6L900 826.5L897 833L893.9 839.2L890.5 845.1L887 850.7L883.2 856.1L879.2 861.2L875.1 866L870.7 870.7L866 875.1L861.2 879.2L856.1 883.2L850.7 887L845.1 890.5L839.2 893.9L833 897L826.5 900L819.6 902.8L812.4 905.4L804.8 907.8L796.8 910.1L788.2 912.2L779.2 914.1L769.6 915.8L759.2 917.4L748.1 918.8L736.1 920L722.9 921.1L708.2 922L691.5 922.7L672.1 923.3L648.2 923.7L615.2 923.9L512 924L408.8 923.9L375.8 923.7L351.9 923.3L332.5 922.7L315.8 922L301.1 921.1L287.9 920L275.9 918.8L264.8 917.4L254.4 915.8L244.8 914.1L235.8 912.2L227.2 910.1L219.2 907.8L211.6 905.4L204.4 902.8L197.5 900L191 897L184.8 893.9L178.9 890.5L173.3 887L167.9 883.2L162.8 879.2L158 875.1L153.3 870.7L148.9 866L144.8 861.2L140.8 856.1L137 850.7L133.5 845.1L130.1 839.2L127 833L124 826.5L121.2 819.6L118.6 812.4L116.2 804.8L113.9 796.8L111.8 788.2L109.9 779.2L108.2 769.6L106.6 759.2L105.2 748.1L104 736.1L102.9 722.9L102 708.2L101.3 691.5L100.7 672.1L100.3 648.2L100.1 615.2L100 512L100.1 408.8L100.3 375.8L100.7 351.9L101.3 332.5L102 315.8L102.9 301.1L104 287.9L105.2 275.9L106.6 264.8L108.2 254.4L109.9 244.8L111.8 235.8L113.9 227.2L116.2 219.2L118.6 211.6L121.2 204.4L124 197.5L127 191L130.1 184.8L133.5 178.9L137 173.3L140.8 167.9L144.8 162.8L148.9 158L153.3 153.3L158 148.9L162.8 144.8L167.9 140.8L173.3 137L178.9 133.5L184.8 130.1L191 127L197.5 124L204.4 121.2L211.6 118.6L219.2 116.2L227.2 113.9L235.8 111.8L244.8 109.9L254.4 108.2L264.8 106.6L275.9 105.2L287.9 104L301.1 102.9L315.8 102L332.5 101.3L351.9 100.7L375.8 100.3L408.8 100.1L512 100L615.2 100.1L648.2 100.3L672.1 100.7L691.5 101.3L708.2 102L722.9 102.9L736.1 104L748.1 105.2L759.2 106.6L769.6 108.2L779.2 109.9L788.2 111.8L796.8 113.9L804.8 116.2L812.4 118.6L819.6 121.2L826.5 124L833 127L839.2 130.1L845.1 133.5L850.7 137L856.1 140.8L861.2 144.8L866 148.9L870.7 153.3L875.1 158L879.2 162.8L883.2 167.9L887 173.3L890.5 178.9L893.9 184.8L897 191L900 197.5L902.8 204.4L905.4 211.6L907.8 219.2L910.1 227.2L912.2 235.8L914.1 244.8L915.8 254.4L917.4 264.8L918.8 275.9L920 287.9L921.1 301.1L922 315.8L922.7 332.5L923.3 351.9L923.7 375.8L923.9 408.8Z',
  );
  const EW = 124,
    EH = 192,
    ER = 46,
    LX = 412,
    RX = 612;

  // Personagem: corpo retangular baixinho (≈ 3:2) com tela embutida
  const BX = 182,
    BY = 330,
    BW = 660,
    BH = 430,
    BOT = BY + BH,
    PCY = BY + BH / 2 + 4;
  const BODY = new Path2D();
  BODY.roundRect(BX, BY, BW, BH, [170, 170, 140, 140]);
  const INS = 30,
    SCR = new Path2D();
  SCR.roundRect(BX + INS, BY + INS, BW - 2 * INS, BH - 2 * INS, [142, 142, 112, 112]);

  function grad(c, y0, y1) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#fff3c2');
    g.addColorStop(0.5, SINAL);
    g.addColorStop(1, '#e3a400');
    return g;
  }
  function pill(c, cx, cy, w, h, r = ER) {
    c.beginPath();
    c.roundRect(cx - w / 2, cy - h / 2, w, h, Math.min(r, w / 2, h / 2));
    c.fillStyle = grad(c, cy - h / 2, cy + h / 2);
    c.fill();
  }
  function dot(c, x, y, r, col) {
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fillStyle = col || grad(c, y - r, y + r);
    c.fill();
  }
  function line(c, pts, w = 44, a = 1, col) {
    let y0 = Infinity,
      y1 = -Infinity;
    pts.forEach((p) => {
      y0 = Math.min(y0, p[1]);
      y1 = Math.max(y1, p[1]);
    });
    c.save();
    c.globalAlpha = a;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = col || grad(c, y0 - w / 2, y1 + w / 2);
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.restore();
  }
  function arc(c, cx, cy, r, w = 44) {
    c.save();
    c.lineWidth = w;
    c.lineCap = 'round';
    c.strokeStyle = grad(c, cy - r - w / 2, cy + w / 2);
    c.beginPath();
    c.arc(cx, cy, r, Math.PI, TAU);
    c.stroke();
    c.restore();
  }

  // dur = s por loop · still = t do quadro fixo · body(t) = movimento do corpo
  // eyes(c, t, cy) = olhos na tela · extra(c, t, tinta) = sinais fora do corpo
  const MOODS = {
    neutro: {
      dur: 1.8,
      still: 0,
      body: (t) => ({ dy: -10 * sin(TAU * t), rot: 0.012 * sin(TAU * t) }),
      eyes(c, t, cy) {
        const b = t > 0.78 && t < 0.88 ? sin(((t - 0.78) / 0.1) * Math.PI) : 0;
        const h = Math.max(24, EH * (1 - b));
        pill(c, LX, cy, EW, h);
        pill(c, RX, cy, EW, h);
      },
    },
    rodando: {
      dur: 1.6,
      still: 0.25,
      sweep: true,
      body: (t) => ({ rot: 0.03 * sin(TAU * t), dx: 6 * sin(TAU * t) }),
      eyes(c, t, cy) {
        const ox = 46 * sin(TAU * t);
        pill(c, LX + ox, cy, EW - 8, EH);
        pill(c, RX + ox, cy, EW - 8, EH);
      },
    },
    passou: {
      dur: 1.2,
      still: 0.75,
      body(t) {
        let dy = 0,
          sx = 1,
          sy = 1;
        if (t < 0.5) {
          const u = t / 0.5;
          dy = -96 * sin(Math.PI * u);
          if (u < 0.12) {
            sy = 0.92;
            sx = 1.06;
          }
        } else if (t < 0.62) {
          const u = (t - 0.5) / 0.12;
          sy = 1 - 0.1 * sin(Math.PI * u);
          sx = 1 + 0.07 * sin(Math.PI * u);
        }
        return { dy, sx, sy, rot: t < 0.5 ? -0.04 * sin((Math.PI * t) / 0.5) : 0 };
      },
      eyes(c, t, cy) {
        arc(c, LX, cy + 48, 60);
        arc(c, RX, cy + 48, 60);
      },
    },
    bug: {
      dur: 2.0,
      still: 0,
      body: (t) => ({ dx: 6 * sin(TAU * t * 10), rot: 0.02 * sin(TAU * t * 5) }),
      eyes(c, t, cy) {
        const look = 30 * sin(TAU * t);
        dot(c, 408 + look, cy + 8, 86);
        dot(c, 616 + look, cy + 8, 86);
      },
      extra(c, t, tinta) {
        const p = 1 + 0.12 * sin(TAU * t * 2);
        c.save();
        c.translate(842, 300);
        c.rotate(0.15 * sin(TAU * t * 2));
        c.scale(p, p);
        dot(c, 0, 0, 54, tinta);
        c.beginPath();
        c.roundRect(-9, -32, 18, 40, 9);
        c.fillStyle = SINAL;
        c.fill();
        dot(c, 0, 22, 10, SINAL);
        c.restore();
      },
    },
    desconfiado: {
      dur: 2.0,
      still: 0.25,
      body: (t) => ({ rot: -0.04 * sin(TAU * t) }),
      eyes(c, t, cy) {
        const ox = 24 * sin(TAU * t);
        pill(c, LX + ox, cy, 148, 56, 28);
        pill(c, RX + ox, cy, EW, EH);
      },
    },
    pensando: {
      dur: 2.0,
      still: 0.9,
      body: (t) => ({ rot: 0.025 * sin(TAU * t), dy: -4 * sin(TAU * t) }),
      eyes(c, t, cy) {
        const ox = 16 * sin(TAU * t);
        pill(c, LX - 24 + ox, cy - 40, EW, EH);
        pill(c, RX - 24 + ox, cy - 40, EW, EH);
      },
      extra(c, t, tinta) {
        const n = Math.floor(t * 4);
        [
          [196, 296, 22],
          [144, 240, 17],
          [104, 190, 12],
        ].forEach(([x, y, r], i) => {
          if (i < n) dot(c, x, y, r, tinta);
        });
      },
    },
    quebrou: {
      dur: 1.5,
      still: 0.04,
      body(t) {
        const fi = Math.floor(t * 30),
          j = fi % 3 === 0 && t < 0.5 ? 8 : 0;
        return {
          dx: j * (fi % 2 ? 1 : -1),
          rot: 0.07 * sin(TAU * t * 2) * (t < 0.5 ? 1 : 0.4),
        };
      },
      eyes(c, t, cy) {
        line(c, [
          [LX - 40, cy - 40],
          [LX + 40, cy + 40],
        ]);
        line(c, [
          [LX + 40, cy - 40],
          [LX - 40, cy + 40],
        ]);
        line(c, [
          [RX - 40, cy - 28],
          [RX + 40, cy + 52],
        ]);
        line(c, [
          [RX + 40, cy - 28],
          [RX - 40, cy + 52],
        ]);
      },
      extra(c, t, tinta) {
        const fi = Math.floor(t * 30);
        if (t < 0.5 && fi % 4 < 2)
          line(
            c,
            [
              [838, 214],
              [876, 252],
              [848, 280],
              [892, 324],
            ],
            20,
            1,
            tinta,
          );
      },
    },
    dormindo: {
      dur: 2.88,
      still: 0.3,
      body(t) {
        const br = sin(TAU * t);
        return { sy: 1 + 0.035 * br, sx: 1 - 0.02 * br };
      },
      eyes(c, t, cy) {
        pill(c, LX, cy + 40, 136, 32, 16);
        pill(c, RX, cy + 40, 136, 32, 16);
      },
      extra(c, t, tinta) {
        for (let k = 0; k < 2; k++) {
          const u = (t + k * 0.5) % 1,
            a = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
          const s = 38 + 26 * u,
            x = 790 + 56 * u,
            y = 270 - 150 * u;
          line(
            c,
            [
              [x, y],
              [x + s, y],
              [x, y + s],
              [x + s, y + s],
            ],
            14,
            Math.max(0, Math.min(1, a)),
            tinta,
          );
        }
      },
    },
  };

  const layers = new Map();
  function layer(px) {
    let o = layers.get(px);
    if (!o) {
      o = document.createElement('canvas');
      o.width = o.height = px;
      layers.set(px, o);
    }
    return o;
  }
  function scan(e, y0, y1) {
    e.globalCompositeOperation = 'source-atop';
    e.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = y0; y < y1; y += 16) e.fillRect(0, y, 1024, 5);
    e.globalCompositeOperation = 'source-over';
  }
  function glow(ctx, L, S) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowColor = 'rgba(255,210,63,0.85)';
    ctx.shadowBlur = 44 * S;
    ctx.drawImage(L, 0, 0);
    ctx.shadowColor = 'rgba(255,210,63,0.5)';
    ctx.shadowBlur = 12 * S;
    ctx.drawImage(L, 0, 0);
    ctx.restore();
  }

  function drawIcon(ctx, px, m, t) {
    const S = px / 1024;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = 28 * S;
    ctx.shadowOffsetY = 12 * S;
    const tg = ctx.createLinearGradient(0, 100, 0, 924);
    tg.addColorStop(0, '#1d1b13');
    tg.addColorStop(1, '#0a0906');
    ctx.fillStyle = tg;
    ctx.fill(SQ);
    ctx.restore();
    ctx.save();
    ctx.clip(SQ);
    const hg = ctx.createRadialGradient(512, 500, 0, 512, 500, 340);
    hg.addColorStop(0, 'rgba(255,210,63,0.2)');
    hg.addColorStop(1, 'rgba(255,210,63,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(100, 100, 824, 824);
    ctx.restore();
    const L = layer(px),
      e = L.getContext('2d');
    e.setTransform(1, 0, 0, 1, 0, 0);
    e.clearRect(0, 0, px, px);
    e.setTransform(S, 0, 0, S, 0, 0);
    m.eyes(e, t, 500);
    scan(e, 0, 1024);
    glow(ctx, L, S);
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.save();
    ctx.clip(SQ);
    const gg = ctx.createLinearGradient(100, 100, 560, 560);
    gg.addColorStop(0, 'rgba(255,255,255,0.09)');
    gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.lineTo(660, 100);
    ctx.lineTo(100, 660);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 6;
    ctx.stroke(SQ);
    ctx.restore();
  }

  function drawCharacter(ctx, px, m, t, tinta) {
    const S = px / 1024,
      b = m.body ? m.body(t) : {};
    const dx = b.dx || 0,
      dy = b.dy || 0,
      sx = b.sx || 1,
      sy = b.sy || 1,
      rot = b.rot || 0;
    const base = new DOMMatrix().scale(S, S).translate(0, -10);
    const M = base
      .translate(512 + dx, BOT + dy)
      .rotate((rot * 180) / Math.PI)
      .scale(sx, sy)
      .translate(-512, -BOT);

    // sombra no chão
    const k = Math.max(0.5, 1 + dy / 240);
    ctx.setTransform(base.translate(512 + dx, BOT + 34).scale(300 * k, 30 * k));
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    sg.addColorStop(0, 'rgba(22,21,15,0.28)');
    sg.addColorStop(1, 'rgba(22,21,15,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, TAU);
    ctx.fill();

    // corpo + tela
    ctx.setTransform(M);
    const bg = ctx.createLinearGradient(0, BY, 0, BOT);
    bg.addColorStop(0, '#2e2b21');
    bg.addColorStop(1, '#100f0a');
    ctx.fillStyle = bg;
    ctx.fill(BODY);
    ctx.save();
    ctx.clip(BODY);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 6;
    ctx.stroke(BODY);
    ctx.restore();
    const scg = ctx.createLinearGradient(0, BY + INS, 0, BOT - INS);
    scg.addColorStop(0, '#15140e');
    scg.addColorStop(1, '#060504');
    ctx.fillStyle = scg;
    ctx.fill(SCR);
    ctx.save();
    ctx.clip(SCR);
    const hg = ctx.createRadialGradient(512, PCY, 0, 512, PCY, 300);
    hg.addColorStop(0, 'rgba(255,210,63,0.18)');
    hg.addColorStop(1, 'rgba(255,210,63,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(BX, BY, BW, BH);
    if (m.sweep) {
      const y = BY + BH * t,
        wg = ctx.createLinearGradient(0, y - 60, 0, y + 6);
      wg.addColorStop(0, 'rgba(255,210,63,0)');
      wg.addColorStop(1, 'rgba(255,210,63,0.12)');
      ctx.fillStyle = wg;
      ctx.fillRect(BX, y - 60, BW, 66);
    }
    ctx.restore();

    // olhos
    const L = layer(px),
      e = L.getContext('2d');
    e.setTransform(1, 0, 0, 1, 0, 0);
    e.clearRect(0, 0, px, px);
    e.setTransform(M);
    m.eyes(e, t, PCY);
    scan(e, BY - 40, BOT + 40);
    ctx.save();
    ctx.setTransform(M);
    ctx.clip(SCR);
    glow(ctx, L, S);
    ctx.restore();

    // reflexo da tela
    ctx.save();
    ctx.setTransform(M);
    ctx.clip(SCR);
    const gg = ctx.createLinearGradient(BX, BY, BX + 380, BY + 380);
    gg.addColorStop(0, 'rgba(255,255,255,0.08)');
    gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.moveTo(BX, BY);
    ctx.lineTo(BX + 470, BY);
    ctx.lineTo(BX, BY + 470);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (m.extra) {
      ctx.save();
      ctx.setTransform(M);
      m.extra(ctx, t, tinta);
      ctx.restore();
    }
  }

  function drawFrame(ctx, px, mood, t, opt = {}) {
    const m = MOODS[mood] || MOODS.neutro;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, px, px);
    if (opt.bg) {
      ctx.fillStyle = opt.bg;
      ctx.fillRect(0, 0, px, px);
    }
    if (opt.forma === 'icone') drawIcon(ctx, px, m, t);
    else drawCharacter(ctx, px, m, t, opt.tinta || '#16150f');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  const reduce = () =>
    window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  class QzOlhos extends HTMLElement {
    static get observedAttributes() {
      return ['mood', 'size', 'forma', 'tinta'];
    }
    connectedCallback() {
      if (!this.cv) {
        this.cv = document.createElement('canvas');
        this.cv.style.display = 'block';
        this.appendChild(this.cv);
      }
      this.resize();
      this.t0 = performance.now();
      cancelAnimationFrame(this.raf);
      const tick = () => {
        this.render();
        this.raf = requestAnimationFrame(tick);
      };
      tick();
    }
    disconnectedCallback() {
      cancelAnimationFrame(this.raf);
    }
    attributeChangedCallback() {
      if (this.cv) this.resize();
    }
    resize() {
      const s = +(this.getAttribute('size') || 128),
        d = Math.min(2, window.devicePixelRatio || 1);
      this.px = Math.round(s * d);
      this.cv.width = this.cv.height = this.px;
      this.cv.style.width = this.cv.style.height = s + 'px';
    }
    render() {
      const mood = this.getAttribute('mood') || 'neutro',
        m = MOODS[mood] || MOODS.neutro;
      const t =
        this.hasAttribute('parado') || reduce()
          ? m.still
          : ((performance.now() - this.t0) / 1000 / m.dur) % 1;
      drawFrame(this.cv.getContext('2d'), this.px, mood, t, {
        forma: this.getAttribute('forma') || 'personagem',
        tinta: this.getAttribute('tinta') || undefined,
      });
    }
  }
  if (window.customElements && !customElements.get('qz-olhos'))
    customElements.define('qz-olhos', QzOlhos);
  window.QZOlhos = { MOODS, drawFrame };
})();
