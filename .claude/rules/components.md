# Componentes — a anatomia em camadas

O QAzinho não tem pacote de design system. Todo componente visual compartilhado mora em
`src/shared/components/`, dividido por **atomic design**:

```
src/shared/components/
├── atoms/        Button, Chip, StatusPill, Input, Icon, IconButton, Caret, Meter, Kbd, Logo,
│                 Intern, Markdown, Wordmark, Tag
├── molecules/    TabBar, SidebarRow, CountTile, TargetCard, MetaGrid
├── organisms/    Titlebar, Sidebar, Composer, PlanCase, ResourcePopover, StepsPopup
└── templates/    AppShell, ModalFrame
```

- **Átomo**: não dá para dividir sem deixar de ser uma coisa própria.
- **Molécula**: um punhado de átomos com uma função.
- **Organismo**: uma região inteira da tela.
- **Template**: o arranjo das regiões, sem conteúdo próprio.
- Um componente usado por **uma tela só** mora no `components/` dessa tela, não aqui.
- Um componente que pertence a um domínio mora em `src/modules/<Domain>/components/`.

## Ícones

- **Todo ícone é do Phosphor**, desenhado pelo átomo `Icon` pelo nome em `ICONS`. Um nome diz o que
  o ícone significa (`close`, `external`, `attention`), e um caret, para onde aponta
  (`caretDown`).
- Bold por padrão, sólido (`fill`) para o que está ligado: controles de mídia, logos, o marcador
  aberto.
- **Um status veste o glifo dentro de um círculo sólido**: `passed`, `failed`, `blocked`,
  `skipped`, `attention`, `running`, `paused`, `stopped`, e `idle` e `pending` como contorno. O
  glifo solto (`check`, `close`, `play`) é um controle, ou uma marca dentro de uma forma própria.
- Um ícone dimensionado pelo texto nunca desenha abaixo de `--icon-min`: no tamanho de texto
  pequeno, um check solto parecia um ✓ digitado.
- Um caractere nunca é um ícone: nada de ✓, ✕, ↗ ou ▸ numa view, numa constante ou numa string.
  Uma tecla num atalho (⌘, ↵) é texto, e continua sendo; uma seta dentro de uma frase também.
- O que se abre dobrando veste o átomo `Caret`, que gira ao abrir.
- Um link que sai do app termina em `external`, e um que anda dentro dele, em `arrow`.

## A anatomia

Todo componente e toda página, sem exceção:

```
<Name>/
├── index.tsx                     view — composição e JSX, nada mais
├── styles.css                    a folha de estilo do componente
├── constants/                    um valor por arquivo, com nome
├── types/                        um tipo por arquivo, com o nome do tipo
├── hooks/
│   └── use<Name>ViewModel/
│       ├── index.ts              estado, handlers, derivações
│       └── __tests__/            o teste do view model
└── components/                   subcomponentes locais, mesma anatomia
```

## A view não tem lógica

O `index.tsx` faz **composição e JSX**, e nada mais. Ele não declara função, não deriva valor, não
guarda estado, e não calcula condição além de renderizar o que o view model resolveu.

```tsx
// ❌ lógica na view
const isActive = tab === current;
function onTabClick(name: string) {}

// ✅ o view model resolve, a view consome
const { tabs, isActive, onTabClick } = useTabBarViewModel(props);
```

## Todo componente tem um view model

Mesmo quando parece pouco demais. É ali que a regra ("não chama `onClick` quando desabilitado")
fica testável sem montar uma árvore.

O view model recebe as props do componente e devolve só o que a view consome.

```ts
export const useTabBarViewModel = (props: ITabBarProps) => {
  const { tabs, current, onChange } = props;
  return { items, onTabClick };
};
```

**Exceção: um componente puramente declarativo.** Nada de `useState`, `useEffect`, `useRef`,
handler ou derivação — só JSX feito de constantes. Um view model vazio com um teste vazio é pior
que nenhum view model. No momento em que qualquer um deles aparece, o view model passa a ser
obrigatório.

## Não memoize à mão

O React Compiler memoiza por você. Um `useCallback` ou `useMemo` cuja dependência sai de um
seletor de store faz ele **pular o componente inteiro** (o
`react-hooks/preserve-manual-memoization` dispara). Escreva a função simples e deixe o compilador
trabalhar.

## Todo view model tem um teste

`hooks/use<Name>ViewModel/__tests__/use<Name>ViewModel.test.ts`. Um `describe` por função
exposta, e os casos que importam: o caminho feliz, o caminho que **não** pode acontecer, e a
borda. Veja `testing.md`.

## Estilos

- Um `styles.css` por componente, importado pelo `index.tsx` dele.
- Os nomes de classe são BEM sobre o nome kebab do componente: `.status-pill`,
  `.status-pill__icon`, `.status-pill--failed`.
- **Nada de `style` inline**, a não ser um valor que o view model calculou e o CSS não tem como
  saber (o deslocamento de um card arrastado, a largura do painel lateral). Ele entra como custom
  property: `style={{ '--device-width': widthPx }}`.
- Cor, espaçamento, raio, fonte e duração vêm de tokens — veja `design-tokens.md`.

## Props

- Um objeto de props, tipado `I<Name>Props`, em `types/I<Name>Props.ts`.
- Um componente que recebe um callback o chama de `onSomething`, e o view model o envolve.
