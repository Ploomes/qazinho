# Estrutura do código

A arquitetura em camadas vem do Rotuz. Os componentes têm regras próprias em `components.md`.

## Uma classe é uma pasta

Toda classe ganha a própria pasta, dentro de uma pasta de categoria sob o `classes/` do processo
dela.

```
src/main/classes/devices/AndroidEmulator/
├── index.ts                  ← exporta só o que é público
├── AndroidEmulator.class.ts  ← a classe
├── library/                  ← as funções da classe, uma por arquivo
├── types/                    ← os tipos da classe, um por arquivo
└── constants/                ← as constantes da classe, uma por arquivo
```

`library/`, `types/` e `constants/` são opcionais. Quando existem, cada uma tem um `index.ts` que
reexporta. Uma pasta de classe **nunca** fica solta em `classes/`: ela sempre vai numa categoria.

## Nomes de arquivo

| Arquivo    | Padrão                     | Exemplo                                   |
| ---------- | -------------------------- | ----------------------------------------- |
| Pasta raiz | `lowercase`                | `src/shared/`, `src/modules/`, `src/app/` |
| Pasta      | `PascalCase`               | `classes/devices/AndroidEmulator/`        |
| Classe     | `<PascalCase>.class.ts`    | `AndroidEmulator.class.ts`                |
| Library    | `camelCase.ts`, uma função | `library/isInternalNavigation.ts`         |
| Constante  | `SCREAMING_SNAKE.ts`, uma  | `constants/DEFAULT_WINDOW_SIZE.ts`        |
| Tipo       | `<TypeName>.ts`, um tipo   | `types/IQazinhoApi.ts`                    |
| Teste      | `__tests__/<name>.test.ts` | `__tests__/isInternalNavigation.test.ts`  |

O arquivo leva o nome da coisa que exporta, e exporta uma coisa só. Um arquivo que guarda duas
funções, dois tipos ou duas constantes cresce sem ninguém perceber.

## Um arquivo guarda uma coisa

Um arquivo de classe guarda a classe. Uma view guarda o JSX. Um view model guarda o estado.
**Nenhuma `function` solta, nenhuma `const` solta, nenhum `type` ao lado.** Uma função vai para
`library/`, onde ganha o próprio arquivo e o próprio teste, ou vira um método privado. Um valor
vai para `constants/`, nomeado, um por arquivo. Um tipo vai para `types/`.

```ts
// ❌ em use<Name>ViewModel/index.ts
const FILTERS = ['all', 'passed'];
function asJson(projects) {}

// ✅ constants/RUN_FILTERS.ts e library/asJson.ts, importados
```

**Imposto** pelo `no-restricted-syntax` sobre `**/*.class.ts`, `src/**/hooks/**/index.ts` e
`src/**/*.tsx`.

**`library/` é a exceção, e só para o que continua privado.** A regra é "exporta uma coisa", então
um arquivo pode manter uma função auxiliar, uma tabela de consulta ou um tipo não exportado ao
lado da única exportação. No momento em que uma segunda coisa é exportada, são dois arquivos.

**Um arquivo de library abre com a sua exportação.** A função exportada vem primeiro, depois dos
imports e de qualquer tipo ou valor privado que ela lê; as funções auxiliares privadas que ela
chama vêm depois, no fim do arquivo, para quem abre o arquivo ler o que ele faz antes do como. Uma
tabela que nomeia um auxiliar enquanto o módulo carrega continua funcionando quando o auxiliar é
uma `function`, que sofre hoisting. O `no-restricted-syntax` sobre `library/` reprova um auxiliar
declarado antes da exportação.

O `src/main/index.ts` é a raiz de composição: ele liga as classes e os handlers de IPC, e as
funções dele ficam lá porque tocam o `electron`, que a `library/` não pode tocar.

## Tipos

- **Um tipo por arquivo, e o arquivo leva o nome do tipo.** O `IQazinhoApi` vive em
  `types/IQazinhoApi.ts`, nunca num `types/Api.ts` que guarda nove.
- Uma `interface` leva o prefixo `I`: `IWorkspace`, `ISidebarProps`. Um `type` ou um `enum` não
  leva: `RunVerdict`, `WorkspaceStatus`.
- Vale para os irmãos também: o `RunVerdict` que só existe para o `IRunStep` ainda ganha o arquivo
  dele.
- Um tipo auxiliar que não é exportado (`type Values<T> = T[keyof T]`) fica com quem o usa, e não
  entra em nenhum barrel.
- **Os tipos de um domínio vivem com o domínio**, em `src/modules/<Domain>/types/`. Um módulo pode
  importar os tipos de outro: o `ITestCase` lê o `StepVerdict` de `@/modules/Run/types`.
- `src/shared/types/` é **só o que é global a todos os lados**: hoje o `IQazinhoApi` e o
  `Platform`, o contrato que o preload publica e a página consome. Nada com forma de domínio vai
  lá.
- Um barrel de `types/` reexporta com `export type *`, nunca `export *`.
- Um resultado com mais de uma forma é uma **união discriminada**, não uma flag opcional.

## Constantes

Um número mágico não vive numa folha de estilo nem numa view. Ele vai para `constants/`, nomeado,
um por arquivo. Os tokens de design têm precedência — veja `design-tokens.md`.

## No máximo 2 parâmetros

Uma função, um método ou um construtor com mais de 2 parâmetros recebe **um objeto**. Imposto
pelo `max-params`. Um componente React recebe um objeto de props só, então sempre está dentro da
regra.

```ts
isInternalNavigation(appUrl, url);
startEmulator({ avd, headless, port });
```

## Ordem dentro de uma classe

```
campos → construtor → métodos públicos → métodos privados
```

Imposta pelo `@typescript-eslint/member-ordering`. Um método privado que cresce é uma função de
`library/` disfarçada.

## Onde cada coisa mora

```
src/main/
├── index.ts          ← ciclo de vida do app e criação da janela
└── classes/  library/  types/  constants/
electron/preload/
└── index.ts          ← a chamada do contextBridge, nada mais
src/
├── index.html  index.tsx  global.d.ts
├── app/              ← o shell, com a anatomia de qualquer componente
├── shared/
│   ├── components/   ← atoms, molecules, organisms, templates (components.md)
│   ├── constants/    ← valores que todo lado compartilha
│   ├── hooks/        ← hooks usados entre módulos
│   ├── styles/       ← tokens.css, base.css, animations.css
│   └── types/        ← contratos, importados por todo lado
├── modules/<Domain>/screens/<Screen>/
├── languages/        ← i18next, en e pt (i18n.md)
├── store/            ← stores do zustand; cada store guarda a própria library/
└── services/         ← os únicos que chamam window.qazinho; Recorder/ é o da janela do gravador
```

- Uma tela → `src/modules/<Domain>/screens/<Screen>/`.
- Um componente ou hook que é de um domínio mas usado por outro módulo →
  `src/modules/<Domain>/components/` ou `hooks/`.
- Um componente sem domínio, reusado entre módulos → `src/shared/components/`.
- Um subcomponente de uma tela só → `components/` **dentro** da pasta dessa tela.
- Uma classe de que a página precisa, sem React nela →
  `src/modules/<Domain>/classes/<category>/<Name>/`, como o `ReplayComposer`.
- O harness mantém a própria estrutura, no próprio repositório (`packages/qazinho-harness`), com
  regras próprias.

## Toda pasta de coisas tem um `index.ts`

Uma pasta que guarda várias coisas (`components/`, `screens/`, `library/`, `hooks/`,
`constants/`, `types/`) as reexporta de um `index.ts`, e quem chama importa a pasta, nunca um
arquivo dentro dela.

**Cada módulo tem um `index.ts` na raiz**, reexportando os `components`, `constants`, `hooks`,
`library` e `screens` dele, e os `types` com `export type *`. Outro módulo o importa inteiro:

```ts
// ❌ a partir de outro módulo
import { flattenPlanSteps } from '@/modules/Run/library';
import { Chat } from '@/modules/Chat/screens/Chat';

// ✅
import { flattenPlanSteps } from '@/modules/Run';
import { Chat } from '@/modules/Chat';
```

- **Dentro de um módulo, os arquivos importam o próprio módulo pelo caminho**
  (`@/modules/Run/library`), nunca pelo `index.ts` dele, que importaria o arquivo de volta.
- **As camadas de baixo importam a pasta pura de um módulo, não o `index.ts` dele:** o
  `src/store/`, e a `library/` e as `constants/` de um módulo, escrevem `@/modules/Chat/library`.
  O `index.ts` de um módulo carrega as telas dele, as telas importam a store, e a store importa
  essas libraries: passar pelo `index.ts` inteiro de baixo fecha esse laço, e uma execução do
  Vitest vê módulos pela metade. Um import só de tipo (`import type`) pode usar o `index.ts` em
  qualquer lugar, já que é apagado.
- `src/shared/components/` tem um `index.ts` para atoms, molecules, organisms e templates juntos.
- `src/main/classes/` e cada categoria dentro dele (`agents/`, `devices/`…) têm um `index.ts`; a
  raiz de composição importa `@/main/classes`. Uma classe importa outra classe pelo caminho dela.

## Idioma

**O código é em inglês**: nomes, strings, nomes de testes e commits. A prosa, os `.md`, o JSDoc e
os comentários dos testes, é em português do Brasil.

## Imports

`@/*` aponta para `./src/*`. **Caminhos relativos para cima são proibidos**: `../` é um erro de
lint. `./` dentro do mesmo diretório continua certo para `./library/`, `./constants/` e
`./types/`.

```ts
import type { IQazinhoApi } from '@/shared/types';
import { isInternalNavigation } from '@/main/library';
```

`import type` sempre no topo, numa declaração separada, sem especificador `type` inline.
