import { describe, expect, it } from 'vitest';
import { siteNameOf } from '@/main/classes/projects/AppNames/library';

describe('siteNameOf', () => {
  it('takes the name the site gives itself first, in either attribute order', () => {
    expect(
      siteNameOf(
        '<head><title>Checkout | Loja</title><meta content="Loja Online" property="og:site_name"></head>',
      ),
    ).toBe('Loja Online');
    expect(
      siteNameOf('<meta name="application-name" content="Painel &amp; Vendas">'),
    ).toBe('Painel & Vendas');
  });

  it('reads the title without the page part or a tagline', () => {
    expect(siteNameOf('<title>Loja Online - As melhores ofertas da semana</title>')).toBe(
      'Loja Online',
    );
    expect(siteNameOf('<title>Início | Loja Online</title>')).toBe('Loja Online');
    expect(siteNameOf('<title> Reservas </title>')).toBe('Reservas');
  });

  /** Um app novo do Vite ou do Next ainda tem o título de exemplo: isso não é um nome. */
  it('does NOT name an app by a starter title, a generic one, or nothing', () => {
    expect(siteNameOf('<title>Vite + React + TS</title>')).toBeNull();
    expect(siteNameOf('<title>React App</title>')).toBeNull();
    expect(siteNameOf('<title>Login</title>')).toBeNull();
    expect(siteNameOf('<html><body>oi</body></html>')).toBeNull();
  });

  it('does NOT take a title too long to be a name', () => {
    expect(siteNameOf(`<title>${'Muito longo '.repeat(8)}</title>`)).toBeNull();
  });
});
