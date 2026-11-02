# Animação

O Motion (`motion/react`) anima a interface. O CSS guarda só o que nunca desmonta.

## Qual dos dois, e quando

| Use o Motion para                                     | Mantenha no CSS                                 |
| ----------------------------------------------------- | ----------------------------------------------- |
| Tudo o que entra ou sai (`AnimatePresence`)           | Loops de ambiente: um ponto pulsando, um brilho |
| Uma lista que se reordena (`Reorder`, `layout`)       | O traço de cometa num caso rodando              |
| Popovers, modais, o lightbox                          | A varredura de gravação sobre o dispositivo     |
| Arrastar: os casos do plano, a alça do painel lateral | `:hover` e `:active` num botão                  |
| Um valor que o view model calcula ao longo do tempo   | O que brigaria com o compositor                 |

Um loop que roda para sempre num elemento montado sai mais barato como keyframe. Uma transição
com começo e fim é do Motion, porque o React sabe quando ela começa.

## As regras

- **Importe `motion` de `motion/react`.** Nunca de `framer-motion`.
- **Durações e easings vêm do `MOTION`** em `src/shared/constants/MOTION.ts`, que espelha os
  tokens de CSS. Um `0.28` cru num componente é o mesmo bug que um `#c6f432` cru.
- **A view guarda o markup, o view model guarda o estado.** O `animate={...}` pode ler um valor que
  o view model devolveu; não pode decidi-lo.
- **A saída precisa de `AnimatePresence`**, e o elemento precisa de uma `key` estável.
- **Uma dobra anima `height` num elemento sem padding, margin nem borda**, e com
  `overflow: hidden`. Altura 0 não consegue espremer o padding, então a dobra para antes e fecha
  num estalo. O espaçamento dela vai num elemento de dentro. Numa coluna com `gap`, a dobra anula o
  gap com uma margem negativa do mesmo token e o leva para dentro (`.chat__retry`).
- **Respeite o sistema.** Envolva o app em `MotionConfig reducedMotion="user"`, uma vez, no shell.
  Nada mais confere a media query.
- Um componente que só aparece com fade ao montar não precisa do Motion. `animation: gc-in` basta.

## Entradas e saídas

As coisas entram e saem com um fade suave (`sticker-design.md`), e nada gira.

- **Entradas e saídas vêm do `STICKER`** em `src/shared/constants/STICKER.ts`:
  - `slap` para coisas pequenas, `panel` para modais, `pop` para um popover abaixo da âncora,
    `rise` para um acima dela, `hero` para o Estagiário, `speak` para o balão dele, que nasce do
    rosto dele depois de a tela trocar.
  - `drag` pega uma coisa arrastada, e `wobble` marca um evento uma vez com um pulso pequeno.
  - Espalhe o movimento: `initial={STICKER.panel.initial} animate={STICKER.panel.animate}
exit={STICKER.panel.exit}`.
- **Uma coisa que só pousa ao montar** usa um keyframe no lugar: `gc-slap` para uma pequena,
  `gc-stick` para um painel. Ponha-o dentro de `@media (prefers-reduced-motion: no-preference)`,
  com `gc-in` fora dele.
- **Hover e press ficam no CSS** e mexem as propriedades separadas `translate` e `scale`, nunca o
  `transform`, por `--lift` e `--press`. O `transform` é do Motion.
- **A evidência nunca se mexe**: o lightbox e o dispositivo entram direto.
