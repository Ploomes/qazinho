# Design

O QAzinho é um lugar calmo e chapado para trabalhar o dia inteiro. **A superfície carrega o
trabalho**: listas, planos, chat, logs, a tela do dispositivo. A marca mora em poucos toques, nunca
em cada peça: o destaque lima, o Estagiário, o wordmark, a Bricolage Grotesque na primeira
execução. Nada é
inclinado, nada veste uma borda de recorte grossa, e nada é colado na tela com tapa, exceto o logo.

**O logo continua um adesivo**: o Estagiário no átomo `Logo` (`isSticker`: borda de recorte branca,
brilho, os -6° e as sombras dele), o `Wordmark`, tinta com uma borda de recorte de papel
(`--sticker-edge`), e a `Tag` que o assina, "BY SALVE SOFTWARE": Tinta com texto mono lima, uma
borda de papel de 2px, a sombra e -2° (`--sticker-edge-width`, `--sticker-shadow`,
`--sticker-tilt`). A `Tag` é só para o lockup, que fica no Sobre, nunca na barra de título; um rótulo em outro lugar é texto simples. Em todo o resto ele é desenhado chapado.

Antes era uma mesa de adesivos recortados: bordas grossas de papel, sombras levantadas, badges
inclinadas e entradas com tapa. Isso pesava para usar por horas, e o QA pediu algo mais leve
(2026-10-22). Os tokens `--sticker-*`, `--edge-*` e `--tilt-*` e o `STICKER` mantêm os nomes, e
agora guardam os valores mais leves.

A arte da designer está em `assets/`: `antena.js` desenha o Estagiário, a antena dele e cada humor,
`humores-png/` e `video/` os mostram, `icone/` guarda os ícones do app, e
`logo/qazinho-lockup.png` é o lockup. O `drawIntern` porta o `antena.js` à mão: quando a designer o
mudar, porte as formas de novo. O `build/icon.png` é o `icone/indigo/app-icon-indigo-1024.png`.

## Elevado ou chapado

A maior parte das coisas é chapada: impressa na superfície, separada por espaço e por uma linha de
1px. Umas poucas ficam um pouco elevadas acima dela.

| Elevado: uma linha de 1px, uma sombra suave só quando flutua      | Chapado: sem linha própria, separado por espaço |
| ----------------------------------------------------------------- | ----------------------------------------------- |
| popovers, menus, modais, o popup de login, o painel do Estagiário | linhas de lista, de tabela e da sidebar         |
| cards: configurações, MCP, integração, alvo, run, handoff         | a conversa do chat, logs, YAML, linhas de passo |
| o composer, inputs                                                | rótulos, eyebrows, o nome do projeto na sidebar |
| botões primários, preenchidos de lima sem contorno                | botões secundários, ghost e de ícone            |

**O chat separa quem fala pelo lado.** A fala do QA fica à direita, num balão `--bubble` sem linha;
a do agente fica chapada à esquerda, com o rosto do Estagiário e o nome dele uma vez por sequência.
A hora aparece com o mouse em cima.

**A evidência nunca é tocada.** Uma captura de tela ou o dispositivo ao vivo não é inclinado,
brilhado, contornado nem coberto. A exceção é o instante de um bug pego (`BugFlash`): o QA pediu que
a tela pisque, a imagem vá para o centro numa moldura sobre o fundo desfocado, chegue perto do que
está errado, e saia em segundos. Nada cobre a imagem: a legenda fica embaixo dela, e o resto da
foto só escurece de leve em volta do elemento marcado.

## A receita

Todo valor vem de um token em `tokens.css` (`design-tokens.md`).

- **Linha**: `border: var(--edge-width) solid var(--edge)`, que é 1px do `--line` do tema. As
  três larguras (`--edge-width`, `-lg`, `-xl`) são todas 1px; um card selecionado deixa a linha
  lima, não mais grossa.
- **Raio**: `--radius-*` como antes; um card é arredondado, nunca reto.
- **Sombra**: `--sticker-rest` e `--sticker-press` são nenhuma, `--sticker-lift` é uma sombra fina
  para um controle em hover, e `--sticker-hero` a única sombra suave que um popover ou modal joga.
- **Inclinação**: nenhuma. Os `--tilt-*` são 0deg e ficam assim; nada que tem texto gira.
- **Tipografia**: uma família, a IBM Plex Sans, nos títulos (600, `--font-display-*`), no corpo e
  nos rótulos, ids, horas e números, que alinham pelos algarismos tabulares. A JetBrains Mono fica só
  no que é código: um endereço, um caminho, uma chamada, a saída de um comando, o nome de uma
  variável (`--font-code-*`). A Bricolage fica na marca: o wordmark, com a borda de recorte de
  papel, e o título da primeira execução (`--font-brand-*`). Rótulo não vai em caixa-alta.
- **Cor**: os neutros puxam para o quente nos dois temas. O lima é a ação principal, o foco, o que
  está rodando, um controle ligado e a marca (o Estagiário e o balão com que ele fala); uma aba
  ativa, um link ou uma seleção usam a tinta. O que passou não ganha verde em cada linha: ele fica
  no resultado de uma run. Um
  status (`StatusPill`) ou uma etiqueta é só o ícone e o texto na cor dele, sem fundo, borda nem
  preenchimento. Um fato repetido em toda linha é um ícone com tooltip. Um aviso veste a cor de leve
  (`--fail-soft` atrás de texto `--fail`), nunca num bloco sólido dela.
  O índigo fica só no ícone do app.
- **Temas**: Night (escuro) e Paper (claro). O QA escolhe um dos dois ou o do computador, o padrão
  (`shownThemeOf`). Os dois declaram todos os tokens.
- **O Estagiário** é desenhado chapado e de pé: lima, olhos escuros, sem borda branca, sem brilho,
  sem sombra. Ele ainda muda de humor. Só o logo o desenha como adesivo.

## Movimento

As coisas se movem pelo `STICKER` em `src/shared/constants/`, ao lado do `MOTION`. O CSS guarda o
hover e o press, e o Motion faz toda entrada e saída (`animation.md`).

| Movimento | O que faz                                                          | Onde                    |
| --------- | ------------------------------------------------------------------ | ----------------------- |
| slap      | uma coisa pequena aparece com fade a partir de um pouco menor      | `STICKER.slap`, `panel` |
| pop       | um popover ou menu aparece com fade a 4px da âncora: `pop`, `rise` | `STICKER.pop`, `rise`   |
| saída     | some com fade em menos de 200ms, mais rápido do que veio           | o `exit` de cada um     |
| drag      | uma coisa arrastada cresce um pouco, sem girar                     | `STICKER.drag`          |
| lift      | hover: `translate: 0 var(--lift)` (0 hoje) e `--sticker-lift`      | CSS, `:hover`           |
| press     | desce `var(--press)`, um pouco menor                               | CSS, `:active`          |
| wobble    | um pulso pequeno para um evento que importa, nunca em loop         | `STICKER.wobble`        |

- Nada gira enquanto se move.
- A mola é quase crítica: sem ultrapassagem que se note.
- Coisas frequentes se movem menos que coisas raras: uma badge que muda todo segundo não se mexe.
- **Movimento reduzido**: o `MotionConfig` transforma todo movimento num fade, e todo lift de CSS
  fica dentro de `@media (prefers-reduced-motion: no-preference)`. O Estagiário fica na pose
  parada.

## Acessibilidade

- O anel de foco é um contorno de 2px no `--lime-ink`, 2px para fora do elemento: lima no Night,
  o verde escuro no Paper, onde o lima some. O que está rodando também usa o `--lime-ink`; o lima
  puro fica como preenchimento, com texto escuro em cima. Um link é tinta sublinhada.
- Uma região que quebra no render vira um aviso com Recarregar (`ErrorBarrier`): a aba, o chat, a
  sidebar, e a tela como último recurso. O resto do app continua.
- Um controle que age leva uma palavra, não só a forma.
- O contraste é conferido nos dois temas: tinta sobre lima, e uma cor de status sobre o fundo
  suave dela.

## Desempenho

- Box shadows só no que flutua. Nunca `filter: drop-shadow` dentro de uma lista.
- Anime `transform` e `opacity`. Nunca anime `filter`.
- O Estagiário pinta em canvas. Abaixo de 32px ele fica numa pose parada (`isStill`), e no máximo
  dois humores rodam na tela ao mesmo tempo.
