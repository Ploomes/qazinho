export const EXAMPLE_SHOP_PAGE = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Loja</title>
<style>
* { box-sizing: border-box; }
body { margin: 0; font: 15px/1.5 system-ui, sans-serif; background: #f6f5f1; color: #1d1c19; }
header { display: flex; align-items: center; gap: 16px; padding: 14px 28px; background: #fff; border-bottom: 1px solid #e4e1d8; position: sticky; top: 0; }
header h1 { font-size: 19px; margin: 0; margin-right: auto; }
button { font: inherit; cursor: pointer; border-radius: 10px; border: 1px solid #d9d5c9; background: #fff; padding: 8px 14px; }
button.main { background: #1d1c19; color: #fff; border-color: #1d1c19; }
input { font: inherit; padding: 9px 12px; border: 1px solid #d9d5c9; border-radius: 10px; background: #fff; }
main { max-width: 920px; margin: 0 auto; padding: 28px; }
.search { display: flex; gap: 8px; margin-bottom: 18px; }
.search input { flex: 1; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 16px; }
.card { background: #fff; border: 1px solid #e4e1d8; border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.pic { height: 110px; border-radius: 12px; background: linear-gradient(135deg, #e9e3d2, #d6cdb4); }
.price { font-weight: 600; }
.alert { background: #fde8e6; color: #9c2a20; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; }
.panel { background: #fff; border: 1px solid #e4e1d8; border-radius: 16px; padding: 22px; max-width: 520px; }
.row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eee; }
.row .name { flex: 1; }
.total { display: flex; justify-content: space-between; font-weight: 600; font-size: 17px; margin: 16px 0; }
.stack { display: flex; flex-direction: column; gap: 10px; }
.hint { color: #6d6a62; font-size: 13px; }
[hidden] { display: none !important; }
</style>
</head>
<body>
<header>
  <h1 data-t="shop"></h1>
  <span id="who" class="hint"></span>
  <button id="go-cart" data-testid="cart-button"></button>
</header>
<main>
  <section id="home">
    <form class="search" id="search-form">
      <input id="search" data-testid="search" />
      <button class="main" data-t="search"></button>
    </form>
    <div id="search-error" class="alert" role="alert" hidden></div>
    <div class="grid" id="grid"></div>
  </section>

  <section id="cart" hidden>
    <div class="panel">
      <h2 data-t="cart"></h2>
      <div id="lines"></div>
      <p id="empty" class="hint" data-t="empty"></p>
      <div class="total"><span data-t="total"></span><span id="total" data-testid="cart-total"></span></div>
      <div class="stack">
        <button class="main" id="checkout" data-testid="checkout" data-t="checkout"></button>
        <button id="back-home" data-t="keep"></button>
      </div>
    </div>
  </section>

  <section id="login" hidden>
    <form class="panel stack" id="login-form">
      <h2 data-t="signIn"></h2>
      <label class="stack"><span data-t="email"></span><input id="email" type="email" autocomplete="username" /></label>
      <label class="stack"><span data-t="password"></span><input id="password" type="password" autocomplete="current-password" /></label>
      <div id="login-error" class="alert" role="alert" hidden data-t="wrong"></div>
      <button class="main" data-t="enter"></button>
      <p class="hint" data-t="demo"></p>
    </form>
  </section>

  <section id="pay" hidden>
    <form class="panel stack" id="pay-form">
      <h2 data-t="pay"></h2>
      <label class="stack"><span data-t="zip"></span><input id="zip" inputmode="numeric" /></label>
      <label class="stack"><span data-t="coupon"></span><input id="coupon" /></label>
      <button class="main" data-testid="place-order" data-t="place"></button>
    </form>
  </section>

  <section id="done" hidden>
    <div class="panel stack">
      <h2 data-t="thanks"></h2>
      <p id="order"></p>
      <button id="again" data-t="keep"></button>
    </div>
  </section>
</main>
<script>
const WORDS = {
  pt: { shop: 'Loja de exemplo', search: 'Buscar', cart: 'Carrinho', empty: 'O carrinho está vazio.', total: 'Total', checkout: 'Finalizar compra', keep: 'Continuar comprando', signIn: 'Entrar', email: 'E-mail', password: 'Senha', wrong: 'E-mail ou senha errados.', enter: 'Entrar', demo: 'Conta de teste: demo@loja.dev · demo123', pay: 'Entrega e pagamento', zip: 'CEP', coupon: 'Cupom', place: 'Confirmar pedido', thanks: 'Pedido confirmado', add: 'Adicionar ao carrinho', searchFailed: 'Não foi possível buscar (erro {status}).', none: 'Nada encontrado.', order: 'Pedido #{id} · {total}', hello: 'Olá, {who}', cartButton: 'Carrinho ({count})', placeholder: 'Buscar produtos', remove: 'Tirar uma', more: 'Mais uma' },
  en: { shop: 'Example shop', search: 'Search', cart: 'Cart', empty: 'Your cart is empty.', total: 'Total', checkout: 'Check out', keep: 'Keep shopping', signIn: 'Sign in', email: 'E-mail', password: 'Password', wrong: 'Wrong e-mail or password.', enter: 'Sign in', demo: 'Test account: demo@loja.dev · demo123', pay: 'Delivery and payment', zip: 'ZIP code', coupon: 'Coupon', place: 'Place order', thanks: 'Order placed', add: 'Add to cart', searchFailed: 'The search failed (error {status}).', none: 'Nothing found.', order: 'Order #{id} · {total}', hello: 'Hi, {who}', cartButton: 'Cart ({count})', placeholder: 'Search products', remove: 'One less', more: 'One more' },
};
const lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'pt';
const w = WORDS[lang];
const say = (key, values) => w[key].replace(/\\{(\\w+)\\}/g, (_, name) => String(values[name]));
const money = (value) => value.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', { style: 'currency', currency: lang === 'en' ? 'USD' : 'BRL' });
const state = { products: [], cart: {}, user: null };
document.documentElement.lang = lang;
document.title = w.shop;
document.querySelectorAll('[data-t]').forEach((node) => { node.textContent = w[node.dataset.t]; });
document.getElementById('search').placeholder = w.placeholder;
const show = (id) => { ['home', 'cart', 'login', 'pay', 'done'].forEach((one) => { document.getElementById(one).hidden = one !== id; }); };
const count = () => Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);
const paint = () => {
  document.getElementById('go-cart').textContent = say('cartButton', { count: count() });
  document.getElementById('who').textContent = state.user ? say('hello', { who: state.user }) : '';
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  if (state.products.length === 0) grid.textContent = w.none;
  state.products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.testid = 'product-' + product.id;
    card.innerHTML = '<div class="pic"></div><strong></strong><span class="price"></span>';
    card.querySelector('strong').textContent = product[lang];
    card.querySelector('.price').textContent = money(product.price);
    const add = document.createElement('button');
    add.textContent = w.add;
    add.dataset.testid = 'add-' + product.id;
    add.onclick = () => { state.cart[product.id] = (state.cart[product.id] || 0) + 1; paint(); };
    card.append(add);
    grid.append(card);
  });
  const lines = document.getElementById('lines');
  lines.innerHTML = '';
  const chosen = Object.entries(state.cart).filter(([, qty]) => qty > 0);
  document.getElementById('empty').hidden = chosen.length > 0;
  document.getElementById('checkout').disabled = chosen.length === 0;
  let total = 0;
  chosen.forEach(([id, qty]) => {
    const product = ALL.find((one) => one.id === id);
    total += product.price;
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = '<span class="name"></span><button class="less"></button><span class="qty"></span><button class="more"></button><span class="sub"></span>';
    row.querySelector('.name').textContent = product[lang];
    row.querySelector('.qty').textContent = String(qty);
    row.querySelector('.sub').textContent = money(product.price * qty);
    const less = row.querySelector('.less');
    less.textContent = '−';
    less.setAttribute('aria-label', w.remove);
    less.onclick = () => { state.cart[id] = qty - 1; paint(); };
    const more = row.querySelector('.more');
    more.textContent = '+';
    more.setAttribute('aria-label', w.more);
    more.onclick = () => { state.cart[id] = qty + 1; paint(); };
    lines.append(row);
  });
  state.total = total;
  document.getElementById('total').textContent = money(total);
};
let ALL = [];
const search = async (query) => {
  const failed = document.getElementById('search-error');
  failed.hidden = true;
  const answer = await fetch('/api/products?q=' + encodeURIComponent(query));
  if (!answer.ok) { failed.textContent = say('searchFailed', { status: answer.status }); failed.hidden = false; return; }
  state.products = (await answer.json()).products;
  paint();
};
document.getElementById('search-form').onsubmit = (event) => { event.preventDefault(); void search(document.getElementById('search').value); };
document.getElementById('go-cart').onclick = () => { paint(); show('cart'); };
document.getElementById('back-home').onclick = () => show('home');
document.getElementById('again').onclick = () => show('home');
document.getElementById('checkout').onclick = () => show(state.user ? 'pay' : 'login');
document.getElementById('login-form').onsubmit = (event) => {
  event.preventDefault();
  const ok = document.getElementById('email').value.trim() === 'demo@loja.dev' && document.getElementById('password').value === 'demo123';
  document.getElementById('login-error').hidden = ok;
  if (!ok) return;
  state.user = 'demo@loja.dev';
  paint();
  show('pay');
};
document.getElementById('pay-form').onsubmit = (event) => {
  event.preventDefault();
  const off = document.getElementById('coupon').value.trim().toUpperCase() === 'BEMVINDO10' ? 0.9 : 1;
  document.getElementById('order').textContent = say('order', { id: 1000 + Math.floor(Math.random() * 9000), total: money(state.total * off) });
  state.cart = {};
  paint();
  show('done');
};
fetch('/api/products?q=*').then((answer) => answer.json()).then((read) => { ALL = read.products; state.products = read.products; paint(); });
</script>
</body>
</html>
`;
