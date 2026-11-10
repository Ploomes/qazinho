# Tokens de design

O QAzinho não tem pacote de design system. A escala é um conjunto de custom properties de CSS em
`src/shared/styles/tokens.css`, declaradas em `[data-theme]`. O layout vem do
`assets/prototype.html`; as cores vêm da marca QAzinho: Lima Estagiário `#C6F432` (`--lime`), Tinta
`#141414` (`--brand-ink`), Bug `#FF4D2E` (`--fail`), Papel `#F4F2EA` (`--brand-paper`) e o índigo
da folha de adesivos (`--indigo`). Como elas são usadas está no `sticker-design.md`.

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
color: var(--lime);
font: var(--font-ui-md);
```

## As escalas

| Grupo       | Tokens                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------- |
| Superfícies | `--bg --win --panel --center --raise --raise2 --screen`, `--bubble` para a fala do QA no chat   |
| Linhas      | `--line --line2 --sel --stripe`, `--line-field` para a borda de um campo de digitar             |
| Tinta       | `--ink --ink2 --ink3`                                                                           |
| Destaque    | `--lime --lime-ink --lime-soft --on-lime`                                                       |
| Vereditos   | `--pass --fail --block --skip --attn`, cada um com um par `-soft`                               |
| Espaço      | `--space-1 2px` · `2 4` · `3 8` · `4 12` · `5 16` · `6 20` · `7 24` · `8 30`                    |
| Ícone       | `--icon-min` 12px, o menor que um ícone dimensionado pelo texto desenha                         |
| Raio        | `--radius-xs 6` · `sm 8` · `md 12` · `lg 14` · `xl 18` · `2xl 22` · `pill 999`                  |
| Fonte       | `--font-display --font-ui --font-mono`, `--font-ui-*`, `--font-display-sm/md/lg/xl`             |
| Tipo        | `--display-tracking` para display em 800, `--font-mono-tag --tag-tracking` para tags            |
| Movimento   | `--ease --ease-in --dur-press --dur-fast --dur --dur-slow`                                      |
| Linha       | `--edge` (o `--line` do tema), `--edge-width` · `-lg` · `-xl`, todos 1px                        |
| Logo        | `--sticker-edge --sticker-edge-width --sticker-shadow --sticker-tilt`, para o adesivo do logo   |
| Elevação    | `--sticker-rest` nenhuma · `--sticker-lift` fina · `--sticker-press` nenhuma · `--sticker-hero` |
| Hover       | `--lift` 0px, `--press` 1px: quanto um controle se move sob o cursor e o clique                 |
| Inclinação  | `--tilt-xs` · `--tilt-sm` · `--tilt-md`, todos 0°: nada gira                                    |
| Marca       | `--brand-ink --brand-paper --indigo --indigo-deep --indigo-dusk --on-indigo`                    |

Um campo mono, o input de URL ou um campo de arquivo ao lado dele, lê `--font-mono-field`, para
dois campos numa linha ficarem da mesma altura.

Os dois temas declaram os mesmos nomes: `[data-theme='dark']` é o Night e `[data-theme='light']` é
o Paper, as duas superfícies do ícone do app.

O `[data-theme='indigo']` não é um tema que o QA escolhe. Um momento da marca (o onboarding, o
quadro de boas-vindas) o põe na própria raiz, para o texto sobre a mesa índigo ficar legível e os
cards sobre ela virarem adesivos grafite. Ele também declara os mesmos nomes. Um token que existe
num escopo e não nos outros é um bug.

## As três famílias

`Bricolage Grotesque` só para display: títulos e contadores em 800 com `--display-tracking`, como
o wordmark. `IBM Plex Sans` para todo texto de corpo e de interface. `JetBrains Mono` para tudo o
que é técnico: ids, horários, caminhos, contadores, eyebrows em maiúsculas, tags, badges, teclas e
glifos de status.

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
