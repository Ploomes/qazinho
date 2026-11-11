# Tokens de design

O QAzinho não tem pacote de design system. A escala é um conjunto de custom properties de CSS em
`src/shared/styles/tokens.css`, declaradas em `[data-theme]`. O layout vem do
`assets/prototype.html`. O acento da interface é o Musgo (`--accent`: `#3F6B4B` no Paper, `#9CC3A2`
no Night), que trocou o lima neon em 2026-11-11; os status são de saturação baixa. A marca guarda a
Tinta `#141414` (`--brand-ink`), o Papel `#F4F2EA` (`--brand-paper`) e o lima do Estagiário
(`--brand-lime`, só nele, no balão dele e na `Tag`) até a marca ser redesenhada; o índigo da folha
de adesivos fica só no ícone do app. Como elas são usadas está no `sticker-design.md`.

## Nunca escreva à mão o que a escala define

Cor, espaçamento, raio, fonte e duração vêm de um token. Um valor cru numa folha de estilo é um bug
a menos que seja geometria de componente (veja abaixo).

```css
/* ❌ */
padding: 9px 16px;
border-radius: 9px;
color: #c6f432;
font:
  500 13px/1 'IBM Plex Sans',
  sans-serif;

/* ✅ */
padding: var(--space-3) var(--space-5);
border-radius: var(--radius-md);
color: var(--accent);
font: var(--font-ui-md);
```

## As escalas

| Grupo       | Tokens                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Superfícies | `--bg --win --panel --center --raise --raise2 --screen`, `--bubble` para a fala do QA no chat    |
| Linhas      | `--line --line2 --sel --stripe`, `--line-field` para a borda de um campo de digitar              |
| Tinta       | `--ink --ink2 --ink3`                                                                            |
| Destaque    | `--accent --accent-ink --accent-soft --on-accent`, e `--brand-lime --on-brand-lime` na marca     |
| Vereditos   | `--pass --fail --block --skip --attn`, cada um com um par `-soft`                                |
| Espaço      | `--space-1 2px` · `2 4` · `3 8` · `4 12` · `5 16` · `6 20` · `7 24` · `8 30`                     |
| Ícone       | `--icon-min` 12px, o menor que um ícone dimensionado pelo texto desenha                          |
| Raio        | `--radius-xs 6` · `sm 8` · `md 12` · `lg 14` · `xl 18` · `2xl 22` · `pill 999`                   |
| Fonte       | `--font-ui-*`, `--font-meta-*`, `--font-display-sm/md/lg/xl`, `--font-code-*`, `--font-brand-*`  |
| Tipo        | `--display-tracking` para títulos, `--brand-tracking` na marca, `--font-mono-tag --tag-tracking` |
| Movimento   | `--ease --ease-in --dur-press --dur-fast --dur --dur-slow`                                       |
| Linha       | `--edge` (o `--line` do tema), `--edge-width` · `-lg` · `-xl`, todos 1px                         |
| Logo        | `--sticker-edge --sticker-edge-width --sticker-shadow --sticker-tilt`, para o adesivo do logo    |
| Elevação    | `--sticker-rest` nenhuma · `--sticker-lift` fina · `--sticker-press` nenhuma · `--sticker-hero`  |
| Hover       | `--lift` 0px, `--press` 1px: quanto um controle se move sob o cursor e o clique                  |
| Inclinação  | `--tilt-xs` · `--tilt-sm` · `--tilt-md`, todos 0°: nada gira                                     |
| Marca       | `--brand-ink --brand-paper`                                                                      |

Um campo de código, o input de URL ou um campo de arquivo ao lado dele, lê `--font-code-field`, para
dois campos numa linha ficarem da mesma altura.

Os dois temas declaram os mesmos nomes: `[data-theme='dark']` é o Night e `[data-theme='light']` é
o Paper, as duas superfícies do ícone do app. O Sistema não é um terceiro tema: a raiz recebe o do
computador (`useSystemTheme`).

Um token que existe num tema e não no outro é um bug.

## As três famílias

`IBM Plex Sans` para tudo o que a interface escreve: os títulos das telas (`--font-display-*`, em
600), o corpo (`--font-ui-*`) e os rótulos, ids, horas, contadores e teclas (`--font-meta-*`).
`JetBrains Mono` só para código (`--font-code-*`): endereços, caminhos, chamadas, a saída de um
comando, o nome e o valor de uma variável. `Bricolage Grotesque` só na marca (`--font-brand-*`): o
wordmark e o título da primeira execução; a `Tag` do lockup continua em `--font-mono-tag`.

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
