# Design

O QAzinho é um lugar calmo e chapado para trabalhar o dia inteiro. **A superfície carrega o
trabalho**: listas, planos, chat, logs, a tela do dispositivo. A marca mora em poucos toques, nunca
em cada peça: o acento amarelo (o Sinal), o personagem, o ícone e o logotipo. Nada é inclinado,
nada veste uma borda de recorte e nada é colado na tela com tapa.

**A marca é a do rebranding de 2026-11-11** (o HTML "QAzinho Marca" da designer): o personagem é
uma tela escura e baixinha com dois olhos acesos no Sinal, e o ícone do app é ele quadrado. O
`Logo` desenha o ícone (`isIcon`), e o `Wordmark` é o logotipo: "QAzınho" em Geist 700, o pingo do
i feito dos dois olhos, na cor do texto no Paper e acesos no Sinal no Night (`--brand-dot`). A `Tag`
assina o lockup ("POR SALVE SOFTWARE") em Geist Mono baixinha, só no Sobre.

Antes era uma mesa de adesivos recortados, depois um Estagiário lima; os dois saíram. O `STICKER`
e os tokens `--sticker-*`, `--edge-*` e `--tilt-*` mantêm os nomes e guardam os valores calmos.

A arte da designer está em `assets/`, fora do Prettier: `olhos.js` desenha o personagem e o ícone em
cada humor, `expressoes/` guarda os oito em PNG, `app-icon/` o ícone em cada tamanho, e
`qazinho-icone.svg` o ícone em vetor. O `drawIntern` porta o `olhos.js` à mão, com as mesmas
formas, tempos e poses paradas: quando a designer o mudar, porte de novo. O `build/icon.png` é o
`app-icon/app-icon-sinal-1024.png`.

## Elevado ou chapado

A maior parte das coisas é chapada: impressa na superfície, separada por espaço e por uma linha de
1px. Umas poucas ficam um pouco elevadas acima dela.

| Elevado: uma linha de 1px, uma sombra suave só quando flutua      | Chapado: sem linha própria, separado por espaço |
| ----------------------------------------------------------------- | ----------------------------------------------- |
| popovers, menus, modais, o popup de login, o painel do Estagiário | linhas de lista, de tabela e da sidebar         |
| cards: configurações, MCP, integração, alvo, run, handoff         | os balões do chat, logs, YAML, linhas de passo  |
| o composer, inputs                                                | rótulos, eyebrows, o nome do projeto na sidebar |
| botões primários, preenchidos de amarelo sem contorno             | botões secundários, ghost e de ícone            |

**O chat separa quem fala pelo lado.** A fala do QA fica à direita, num balão `--bubble` sem linha;
a do agente fica num balão `--raise` à esquerda, também sem linha, com o rosto do Estagiário e o
nome dele uma vez por sequência: texto solto lia estranho ao lado do balão do QA (2026-11-11). O que o
agente disse dentro de uma run continua chapado no cartão dela. A hora aparece com o mouse em cima.

**A evidência nunca é tocada.** Uma captura de tela ou o dispositivo ao vivo não é inclinado,
brilhado, contornado nem coberto. A exceção é o instante de um bug pego (`BugFlash`): o QA pediu que
a tela pisque, a imagem vá para o centro numa moldura sobre o fundo desfocado, chegue perto do que
está errado, e saia em segundos. Nada cobre a imagem: a legenda fica embaixo dela, e o resto da
foto só escurece de leve em volta do elemento marcado.

## A receita

Todo valor vem de um token em `tokens.css` (`design-tokens.md`).

- **Linha**: `border: var(--edge-width) solid var(--edge)`, que é 1px do `--line` do tema. As
  três larguras (`--edge-width`, `-lg`, `-xl`) são todas 1px; um card selecionado deixa a linha
  no acento, não mais grossa.
- **Raio**: `--radius-*` como antes; um card é arredondado, nunca reto.
- **Sombra**: `--sticker-rest` e `--sticker-press` são nenhuma, `--sticker-lift` é uma sombra fina
  para um controle em hover, e `--sticker-hero` a única sombra suave que um popover ou modal joga.
- **Inclinação**: nenhuma. Os `--tilt-*` são 0deg e ficam assim; nada que tem texto gira.
- **Tipografia**: uma família, a Geist, nos títulos (600, `--font-display-*`), no corpo e nos
  rótulos, ids, horas e números, que alinham pelos algarismos tabulares, e no logotipo e no título da
  primeira execução (700, `--font-brand-*`). A Geist Mono fica no que é código: um endereço, um
  caminho, uma chamada, a saída de um comando, o nome de uma variável (`--font-code-*`), e na
  assinatura do lockup. Rótulo não vai em caixa-alta.
- **Cor**: os neutros são cinzas sem tom nos dois temas, para o amarelo não tingir tudo. O amarelo (`--accent`, e `--accent-fill` num botão) é a ação principal,
  o foco, o que está rodando e um controle ligado; nenhuma cor neon. O Sinal puro fica na marca: os
  olhos do personagem e o balão com que ele fala (`--brand-sinal`). A aba ativa veste o sublinhado
  no acento; um link ou uma seleção usam a tinta. Um gráfico dá uma cor a cada categoria. O que passou não ganha verde em cada linha: ele fica
  no resultado de uma run. Um
  status (`StatusPill`) ou uma etiqueta é só o ícone e o texto na cor dele, sem fundo, borda nem
  preenchimento. Um fato repetido em toda linha é um ícone com tooltip. Um aviso veste a cor de leve
  (`--fail-soft` atrás de texto `--fail`), nunca num bloco sólido dela.
- **Temas**: Night (escuro) e Paper (claro). O QA escolhe um dos dois ou o do computador, o padrão
  (`shownThemeOf`). Os dois declaram todos os tokens.
- **O Estagiário** é o personagem da marca: o corpo escuro, a tela e os olhos no Sinal com o brilho
  e as linhas que a designer desenhou, nos oito humores dela. Os sinais fora do corpo (o balão do
  bug, os pensamentos, os zzz) usam a tinta do tema, para aparecer nos dois.

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
| glide     | a dica desliza até o vizinho seguinte e troca as palavras          | `STICKER.glide`         |

- Nada gira enquanto se move.
- A mola é quase crítica: sem ultrapassagem que se note.
- Coisas frequentes se movem menos que coisas raras: uma badge que muda todo segundo não se mexe.
- **Movimento reduzido**: o `MotionConfig` transforma todo movimento num fade, e todo lift de CSS
  fica dentro de `@media (prefers-reduced-motion: no-preference)`. O Estagiário fica na pose
  parada.

## Acessibilidade

- O anel de foco é um contorno de 2px no `--accent-ink`, 2px para fora do elemento. O que está
  rodando também usa o `--accent-ink`, e o `--accent-fill` preenche o botão principal com o
  `--on-accent-fill` em cima. Um link é tinta sublinhada.
- Uma região que quebra no render vira um aviso com Recarregar (`ErrorBarrier`): a aba, o chat, a
  sidebar, e a tela como último recurso. O resto do app continua.
- Um controle que age leva uma palavra, não só a forma.
- O contraste é conferido nos dois temas: o `--on-accent-fill` sobre o amarelo, e uma cor de status sobre o fundo
  suave dela.

## Desempenho

- Box shadows só no que flutua. Nunca `filter: drop-shadow` dentro de uma lista.
- Anime `transform` e `opacity`. Nunca anime `filter`.
- O Estagiário pinta em canvas. Abaixo de 32px ele fica numa pose parada (`isStill`), e no máximo
  dois humores rodam na tela ao mesmo tempo.
