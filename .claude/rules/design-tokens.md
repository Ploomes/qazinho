# Tokens de design

O QAzinho não tem pacote de design system. A escala é um conjunto de custom properties de CSS em
`src/shared/styles/tokens.css`, declaradas em `[data-theme]`. O layout vem do
`assets/prototype.html`. As cores da marca (2026-11-11) são cinco: o Sinal `#FFD23F`, a luz dos olhos
e o acento no Night; o Âmbar `#7D5D00`, o acento do Paper para linha, texto e foco, porque o Sinal
some no claro (1,4:1); e a Tela `#0A0906`, o Grafite `#16150F` e o Papel `#F2F1EC`, que ficam nas
peças da marca: o ícone, o personagem, o logotipo, o texto sobre um botão. **As superfícies, as
linhas e a tinta da interface são cinzas sem tom**: a Tela, o Grafite e o Papel puxam para o oliva e
o creme, e como base deixavam o app inteiro amarelado (o QA reprovou duas vezes). Os botões
preenchidos leem `--accent-fill` (o Sinal nos dois temas) com `--on-accent-fill` (a Tela) em cima;
linha, texto, foco e o que roda leem `--accent`/`--accent-ink`. A pergunta do agente (`--attn`) é
laranja, para não se confundir com o amarelo do que roda. Os status são de saturação baixa, e a
falha é um vermelho puro (`#C42B2B`, `#EF5B5B`). A marca guarda o Grafite (`--brand-ink`), o Papel
(`--brand-paper`), o Sinal (`--brand-sinal`) e o pingo do logotipo (`--brand-dot`). Como elas são
usadas está no `sticker-design.md`.

## Nunca escreva à mão o que a escala define

Cor, espaçamento, raio, fonte e duração vêm de um token. Um valor cru numa folha de estilo é um bug
a menos que seja geometria de componente (veja abaixo).

```css
/* ❌ */
padding: 9px 16px;
border-radius: 9px;
color: #c6f432;
font:
  500 13px/1 'Geist',
  sans-serif;

/* ✅ */
padding: var(--space-3) var(--space-5);
border-radius: var(--radius-md);
color: var(--accent);
font: var(--font-ui-md);
```

## As escalas

| Grupo       | Tokens                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| Superfícies | `--bg --win --panel --center --raise --raise2 --screen`, `--bubble` para a fala do QA no chat                    |
| Linhas      | `--line --line2 --sel --stripe`, `--line-field` para a borda de um campo de digitar                              |
| Tinta       | `--ink --ink2 --ink3`                                                                                            |
| Destaque    | `--accent --accent-ink --accent-soft --accent-fill --on-accent --on-accent-fill`, e `--brand-sinal`              |
| Vereditos   | `--pass --fail --block --skip --attn`, cada um com um par `-soft`                                                |
| Espaço      | `--space-1 2px` · `2 4` · `3 8` · `4 12` · `5 16` · `6 20` · `7 24` · `8 30`                                     |
| Ícone       | `--icon-min` 12px, o menor que um ícone dimensionado pelo texto desenha                                          |
| Raio        | `--radius-xs 6` · `sm 8` · `md 12` · `lg 14` · `xl 18` · `2xl 22` · `pill 999`                                   |
| Fonte       | `--font-ui-*`, `--font-meta-*`, `--font-display-sm/md/lg/xl`, `--font-figure`, `--font-code-*`, `--font-brand-*` |
| Tipo        | `--display-tracking` para títulos, `--brand-tracking` na marca, `--font-mono-tag --tag-tracking`                 |
| Movimento   | `--ease --ease-in --dur-press --dur-fast --dur --dur-slow`                                                       |
| Linha       | `--edge` (o `--line` do tema), `--edge-width` · `-lg` · `-xl`, todos 1px                                         |
| Elevação    | `--sticker-rest` nenhuma · `--sticker-lift` fina · `--sticker-press` nenhuma · `--sticker-hero`                  |
| Hover       | `--lift` 0px, `--press` 1px: quanto um controle se move sob o cursor e o clique                                  |
| Inclinação  | `--tilt-xs` · `--tilt-sm` · `--tilt-md`, todos 0°: nada gira                                                     |
| Marca       | `--brand-ink --brand-paper --brand-sinal --on-brand-sinal --brand-dot --brand-dot-glow`                          |

Um campo de código, o input de URL ou um campo de arquivo ao lado dele, lê `--font-code-field`, para
dois campos numa linha ficarem da mesma altura.

Os dois temas declaram os mesmos nomes: `[data-theme='dark']` é o Night e `[data-theme='light']` é
o Paper, as duas superfícies do ícone do app. O Sistema não é um terceiro tema: a raiz recebe o do
computador (`useSystemTheme`).

Um token que existe num tema e não no outro é um bug.

## As duas famílias

`Geist` para tudo o que a interface escreve: os títulos das telas (`--font-display-*`, em 600), o
corpo (`--font-ui-*`), os rótulos, ids, horas, contadores e teclas (`--font-meta-*`), e a marca
(`--font-brand-*`, em 700): o logotipo e o título da primeira execução. `Geist Mono` para código
(`--font-code-*`): endereços, caminhos, chamadas, a saída de um comando, o nome e o valor de uma
variável; e a assinatura do lockup (`--font-mono-tag`).

## Quando um valor não está na escala

- **Geometria de componente** — uma dimensão intrínseca de um componente (a sidebar de 268px, a
  titlebar de 46px, a proporção 9/19.5 do celular). Ela vai no `constants/` desse componente, com
  nome, nunca escrita direto na folha de estilo.
- **Um buraco na escala** — o protótipo continua pedindo um degrau que não existe. Não o arredonde
  em silêncio e não o escreva à mão: acrescente o degrau, e diga isso.

Arredondar um valor para o token mais próximo muda o design. Quando fizer isso, diga quais valores
mudaram e em quanto.

## A cor nunca é a única pista

Todo status leva um ícone e uma palavra ao lado da cor. Numa lista que repete o status linha a
linha, o ícone fica sozinho, cada um com a forma dele, e a palavra vai no `title` e no `aria-label`
(`StatusPill` com `label=""`). O status não veste fundo: nada de pílula em volta de ícone e texto.
