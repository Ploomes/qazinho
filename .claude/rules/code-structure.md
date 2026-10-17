# Code structure

The layered architecture comes from Rotuz. Components have their own rules in `components.md`.

## A class is a folder

Every class gets its own folder, inside a category folder under its process's `classes/`.

```
src/main/classes/devices/AndroidEmulator/
├── index.ts                  ← exports only what is public
├── AndroidEmulator.class.ts  ← the class
├── library/                  ← the class's functions, one per file
├── types/                    ← the class's types, one per file
└── constants/                ← the class's constants, one per file
```

`library/`, `types/` and `constants/` are optional. When they exist, each one has an `index.ts`
that re-exports. A class folder **never** sits loose in `classes/`: it always goes in a category.

## File names

| File        | Pattern                      | Example                                       |
| ----------- | ---------------------------- | --------------------------------------------- |
| Root folder | `lowercase`                  | `src/components/`, `src/modules/`, `src/app/` |
| Folder      | `PascalCase`                 | `classes/devices/AndroidEmulator/`            |
| Class       | `<PascalCase>.class.ts`      | `AndroidEmulator.class.ts`                    |
| Library     | `camelCase.ts`, one function | `library/isInternalNavigation.ts`             |
| Constant    | `SCREAMING_SNAKE.ts`, one    | `constants/DEFAULT_WINDOW_SIZE.ts`            |
| Type        | `<TypeName>.ts`, one type    | `types/IQazinhoApi.ts`                        |
| Test        | `__tests__/<name>.test.ts`   | `__tests__/isInternalNavigation.test.ts`      |

The file is named after the thing it exports, and it exports one thing. A file that holds two
functions, two types or two constants grows without anyone noticing.

## One file holds one thing

A class file holds the class. A view holds the JSX. A view model holds the state. **No loose
`function`, no loose `const`, no `type` beside it.** A function goes to `library/`, where it gets
its own file and its own test, or becomes a private method. A value goes to `constants/`, named,
one per file. A type goes to `types/`.

```ts
// ❌ in use<Name>ViewModel/index.ts
const FILTERS = ['all', 'passed'];
function asJson(projects) {}

// ✅ constants/RUN_FILTERS.ts and library/asJson.ts, imported
```

**Enforced** by `no-restricted-syntax` over `**/*.class.ts`, `src/**/hooks/**/index.ts` and
`src/**/*.tsx`.

**`library/` is the exception, and only for what stays private.** The rule is "exports one
thing", so a file may keep a helper function, a lookup table or a non-exported type next to its
single export. The moment a second thing is exported, it is two files.

`src/main/index.ts` is the composition root: it wires the classes and the IPC handlers, and its
functions stay there because they touch `electron` and `library/` may not.

## Types

- **One type per file, and the file is named after the type.** `IQazinhoApi` lives in
  `types/IQazinhoApi.ts`, never in a `types/Api.ts` that holds nine.
- An `interface` carries the `I` prefix: `IWorkspace`, `ISidebarProps`. A `type` or an `enum`
  does not: `RunVerdict`, `WorkspaceStatus`.
- Applies to siblings too: the `RunVerdict` that only exists for `IRunStep` still gets its file.
- A helper type that is not exported (`type Values<T> = T[keyof T]`) stays with its user, and
  enters no barrel.
- **A domain's types live with the domain**, in `src/modules/<Domain>/types/`. A module may
  import another module's types: `ITestCase` reads `StepVerdict` from `@/modules/Run/types`.
- `src/types/` is **only what is global to every side**: today `IQazinhoApi` and `Platform`, the
  contract the preload publishes and the page consumes. Nothing domain-shaped goes there.
- A `types/` barrel re-exports with `export type *`, never `export *`.
- A result with more than one shape is a **discriminated union**, not an optional flag.

## Constants

A magic number does not live in a stylesheet or in a view. It goes to `constants/`, named, one
per file. Design tokens have precedence — see `design-tokens.md`.

## At most 2 parameters

A function, method or constructor with more than 2 parameters takes **an object**. Enforced by
`max-params`. A React component takes one props object, so it is always within it.

```ts
isInternalNavigation(appUrl, url);
startEmulator({ avd, headless, port });
```

## Order inside a class

```
fields → constructor → public methods → private methods
```

Enforced by `@typescript-eslint/member-ordering`. A private method that grows is a `library/`
function in disguise.

## Where each thing lives

```
src/main/
├── index.ts          ← app lifecycle and window creation
└── classes/  library/  types/  constants/
electron/preload/
└── index.ts          ← the contextBridge call, nothing else
src/
├── index.html  index.tsx  global.d.ts
├── app/              ← the shell, with the anatomy of any component
├── components/       ← atoms, molecules, organisms, templates (components.md)
├── modules/<Domain>/screens/<Screen>/
├── languages/        ← i18next, en and pt (i18n.md)
├── hooks/            ← hooks used across modules
├── store/            ← zustand stores
├── services/         ← the only callers of window.qazinho
├── styles/           ← tokens.css, base.css, animations.css
└── types/            ← contracts, imported by every side
```

- A screen → `src/modules/<Domain>/screens/<Screen>/`.
- A component or hook owned by a domain but used by another module →
  `src/modules/<Domain>/components/` or `hooks/`.
- A component with no domain, reused across modules → `src/components/`.
- A subcomponent of one screen → `components/` **inside** that screen's folder.

## Every folder of things has an `index.ts`

A folder that holds several things (`components/`, `screens/`, `library/`, `hooks/`,
`constants/`, `types/`) re-exports them from an `index.ts`, and a caller imports the folder, never
one file inside it.

**Each module has an `index.ts` at its root**, re-exporting its `components`, `constants`, `hooks`,
`library` and `screens`, and its `types` with `export type *`. Another module imports it whole:

```ts
// ❌ from another module
import { flattenPlanSteps } from '@/modules/Run/library';
import { Chat } from '@/modules/Chat/screens/Chat';

// ✅
import { flattenPlanSteps } from '@/modules/Run';
import { Chat } from '@/modules/Chat';
```

- **Inside a module, files import their own module by path** (`@/modules/Run/library`), never
  through its own `index.ts`, which would import the file back.
- **The bottom layers import a module's pure folder, not its `index.ts`:** `src/store/`, and a
  module's `library/` and `constants/`, write `@/modules/Chat/library`. A module's `index.ts`
  carries its screens, the screens import the store, and the store imports those libraries: going
  through the whole `index.ts` from below closes that loop, and a Vitest run sees half-loaded
  modules. A type-only import (`import type`) may use the `index.ts` anywhere, since it is erased.
- `src/components/` has an `index.ts` for atoms, molecules, organisms and templates together.
- `src/main/classes/` and each category in it (`agents/`, `devices/`…) have an `index.ts`; the
  composition root imports `@/main/classes`. A class imports another class by its own path.

## Language

**All code is in English**: names, every string the code emits, error messages, UI copy,
comments, test descriptions and documentation. There is no Portuguese anywhere in this
repository.

## Imports

`@/*` points at `./src/*`. **Upward relative paths are forbidden**: `../` is a lint error. `./`
within the same directory is still right for `./library/`, `./constants/` and `./types/`.

```ts
import type { IQazinhoApi } from '@/types';
import { isInternalNavigation } from '@/main/library';
```

`import type` always at the top, in a separate declaration, with no inline `type` specifier.
