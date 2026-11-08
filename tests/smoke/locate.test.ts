import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebDriver } from '@salve-software/qazinho-harness/engine';

/**
 * Uma página de login, como a da loja: um link "Entrar" no menu e um botão "Entrar" no
 * formulário, com o título da página dizendo "Entrar" também. O agente chamou o botão de
 * "Entrar #2", e o clique caía no título.
 */
const PAGE = `<!doctype html><html><head><meta charset="utf-8"></head><body>
  <header><a href="#menu">Entrar</a></header>
  <h1>Entrar</h1>
  <form onsubmit="event.preventDefault(); document.getElementById('out').textContent = 'Form sent'">
    <input aria-label="E-mail"><button>Entrar</button>
  </form>
  <p id="out">Nothing sent</p>
  <label>State <select onchange="document.getElementById('state').textContent = 'Picked ' + this.value"><option value="">Choose</option><option value="SP">São Paulo</option></select></label>
  <label>Nickname <input></label>
  <p id="state">Nothing picked</p>
  <label>Birth date <input type="date" onchange="document.getElementById('born').textContent = 'Born ' + this.value"></label>
  <p id="born">No date yet</p>
  <shop-button>Subscribe now</shop-button>
  <div role="tablist"><div role="tab" tabindex="0">Summary</div><div role="tab" tabindex="-1">Invoices</div></div>
  <div role="switch" aria-checked="false" tabindex="0" aria-label="Dark mode"></div>
  <div role="tablist"><div role="tab" tabindex="0" onclick="document.getElementById('pick').textContent = 'Tab Etiqueta picked'">Etiqueta</div></div>
  <button onclick="document.getElementById('pick').textContent = 'New label opened'">Nova etiqueta de produto</button>
  <p id="pick">Nothing picked yet</p>
  <div role="input" tabindex="0" aria-label="Login email" id="custom" style="width:200px;height:24px"></div>
  <input data-testid="coupon-code" placeholder="Código promocional">
  <script>
    const custom = document.getElementById('custom');
    custom.addEventListener('keydown', (event) => {
      if (event.key.length === 1) custom.textContent += event.key;
      event.preventDefault();
    });
  </script>
  <script>
    customElements.define('shop-button', class extends HTMLElement {
      connectedCallback() {
        this.attachShadow({ mode: 'open' }).innerHTML = '<button><slot></slot></button>';
      }
    });
  </script>
</body></html>`;

const PORT = 4339;
const site = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(PAGE);
});
let driver: WebDriver;

beforeAll(async () => {
  await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));
  driver = new WebDriver({
    url: `http://127.0.0.1:${String(PORT)}/`,
    profileDir: await mkdtemp(join(tmpdir(), 'qazinho-locate-')),
  });
  await driver.open();
});

afterAll(async () => {
  await driver.close();
  site.close();
});

describe('controls that read alike in different roles', () => {
  it('are numbered in the order the page shows them', async () => {
    const screen = await driver.describe();

    expect(screen).toContain('a: Entrar #1');
    expect(screen).toContain('button: Entrar #2');
  });

  it('"#2" clicks the second one look listed, the form button', async () => {
    await driver.act({ kind: 'click', target: 'Entrar #2', value: '' });

    expect(await driver.describe()).toContain('Form sent');
  });

  it('"#1" clicks the first one look listed, the menu link', async () => {
    await driver.act({ kind: 'click', target: 'Entrar #1', value: '' });

    expect(await driver.describe()).toContain('URL: http://127.0.0.1:4339/#menu');
  });
});

/**
 * Um formulário rotulado do jeito simples, com <label>: o look listava os campos dele sem
 * nome nenhum, e um fill no dropdown de estado falhava, já que um dropdown não se digita.
 */
describe('a form labelled with <label>', () => {
  it('lists each field by its label', async () => {
    const screen = await driver.describe();

    expect(screen).toContain('select: State');
    expect(screen).toContain('input: Nickname');
  });

  it('picks the option a fill names on a dropdown, by what it reads', async () => {
    await driver.act({ kind: 'fill', target: 'State', value: 'São Paulo' });

    expect(await driver.describe()).toContain('Picked SP');
  });

  it('says which options there are when the one named is not', async () => {
    await expect(
      driver.act({ kind: 'fill', target: 'State', value: 'Bahia' }),
    ).rejects.toThrow('It offers: Choose, São Paulo.');
  });
});

/**
 * O Chrome guarda um campo de data como YYYY-MM-DD seja o que for que mostre, e o
 * Playwright só o preenche desse jeito: "10/05/1990", como um plano brasileiro a escreve,
 * falhava com um seco "Malformed value".
 */
describe('a date field', () => {
  it('takes a date written the way the browser keeps it', async () => {
    await driver.act({ kind: 'fill', target: 'Birth date', value: '1990-05-10' });

    expect(await driver.describe()).toContain('Born 1990-05-10');
  });

  it('says how to write it when it was written another way', async () => {
    await expect(
      driver.act({ kind: 'fill', target: 'Birth date', value: '10/05/1990' }),
    ).rejects.toThrow(
      '"Birth date" takes a date written YYYY-MM-DD, such as 1990-05-10.',
    );
  });
});

/**
 * O botão de um design system: o <button> vive numa shadow root, e as palavras dele são
 * do host, por slot. O innerText dele é vazio, então o look o deixava fora dos controles
 * que o agente lê.
 */
describe('a button inside a web component', () => {
  it('is listed by the words slotted into it', async () => {
    expect(await driver.describe()).toContain('button: Subscribe now');
  });
});

/**
 * Abas e switches feitos de divs com um papel ARIA, como a maioria das bibliotecas de
 * componentes os desenha: um clique num funcionava, mas o look não listava nenhum, então
 * o agente não sabia que eram controles.
 */
describe('controls drawn as divs with an ARIA role', () => {
  it('are listed by their role and their words', async () => {
    const screen = await driver.describe();

    expect(screen).toContain('tab: Invoices');
    expect(screen).toContain('switch: Dark mode');
  });
});

/**
 * Uma lista de produtos: a aba "Etiqueta" ao lado do botão "Nova etiqueta de produto". Um
 * clique em "Etiqueta" caía no botão, que contém a palavra, e abria o modal do botão: o
 * agente abriu um bug dizendo que a aba abria o modal.
 */
describe('a name said whole, beside a longer one that holds it', () => {
  it('clicks the tab named exactly, not the button that holds the word', async () => {
    await driver.act({ kind: 'click', target: 'Etiqueta', value: '' });

    expect(await driver.describe()).toContain('Tab Etiqueta picked');
  });

  it('still reaches the longer one by its own name', async () => {
    await driver.act({ kind: 'click', target: 'Nova etiqueta de produto', value: '' });

    expect(await driver.describe()).toContain('New label opened');
  });
});

/**
 * O login de uma loja: campos desenhados como divs que só escutam o teclado. O fill do
 * Playwright os recusava, e a run pedia ao QA que entrasse à mão.
 */
describe('a field drawn as a div', () => {
  it('takes what is typed into it, by the keyboard', async () => {
    await driver.act({ kind: 'fill', target: 'Login email', value: 'qa@shop.test' });

    expect(await driver.describe()).toContain('qa@shop.test');
  });
});

/** Um campo com test id: o look o mostra, e o agente o acha por ele mesmo se as palavras mudarem. */
describe('a control with a test id', () => {
  it('is listed with its test id', async () => {
    expect(await driver.describe()).toContain(
      'input: Código promocional [testid=coupon-code]',
    );
  });

  it('is filled by its test id', async () => {
    await driver.act({ kind: 'fill', target: 'testid=coupon-code', value: 'SAVE10' });

    expect(driver.resolution?.()?.locator).toContain("getByTestId('coupon-code')");
  });
});
