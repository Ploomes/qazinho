# Code structure

## A class is a folder

Every class gets its own folder, inside a category folder under its process's `classes/`. The
tree below is the shape, not a file that exists yet.

```
src/main/classes/devices/android-emulator/
├── index.ts                     ← exports only what is public
├── android-emulator.class.ts    ← the class
├── library/                     ← the class's functions
├── types/                       ← the class's types
└── constants/                   ← the class's constants
```

`library/`, `types/` and `constants/` are optional. When they exist: **one file per thing** plus
an `index.ts` re-exporting. One type per file, always.

A class folder **never** sits loose in `classes/`. It always goes inside a category.

## File names

| File      | Pattern                          | Example                             |
| --------- | -------------------------------- | ----------------------------------- |
| Class     | `<kebab>.class.ts`               | `android-emulator.class.ts`         |
| Library   | `<kebab>.ts`                     | `library/is-internal-navigation.ts` |
| Type      | `<kebab>.ts`                     | `types/qaceo-api.ts`                |
| Constant  | `<kebab>.ts`                     | `constants/default-window-size.ts`  |
| Component | `components/<kebab>/<kebab>.tsx` | `components/sidebar/sidebar.tsx`    |
| Hook      | `hooks/use-<kebab>.ts`           | `hooks/use-workspace.ts`            |

The `.class.ts` suffix belongs to classes only. A component's stylesheet sits next to it with
the same name: `sidebar.tsx` and `sidebar.css`.

## A class file holds the class, and nothing else

**No loose `function`, no `type` declared in the class file.** Functions go to `library/`, where
they get their own file and test, or become private methods. Types go to `types/`.

**Enforced** by `no-restricted-syntax` over `**/*.class.ts` in `eslint.config.mjs`.

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

## Language

**All code is in English**: names, every string the code emits, error messages, UI copy,
comments, test descriptions and documentation. There is no Portuguese anywhere in this
repository.

## Types

- No `I` or `T` prefix. It is `QaceoApi`, never `IQaceoApi`.
- **`src/shared/types/` holds only what crosses a process boundary**, and never imports from
  `main`, `preload` or `renderer`.
- Everything else lives with its owner: a class's options type is in that class's `types/`.
- A `types/` barrel re-exports with `export type *`, never `export *`.
- A result with more than one shape is a **discriminated union**, not an optional flag.

## The root of each process

```
src/main/
├── index.ts          ← app lifecycle and window creation
└── classes/  library/  types/  constants/
src/preload/
└── index.ts          ← the contextBridge call, nothing else
src/renderer/
├── index.html  main.tsx  app.tsx  global.d.ts
├── components/<name>/
├── pages/<name>/
├── hooks/
└── styles/
src/shared/
└── types/
```

## Imports

`@/*` points at `./src/*`. **Upward relative paths are forbidden**: `../` is a lint error. `./`
within the same directory is still right for `./library/`, `./constants/` and `./types/`.

```ts
import type { QaceoApi } from '@/shared/types';
import { isInternalNavigation } from '@/main/library';
```

`import type` always at the top, in a separate declaration, with no inline `type` specifier.
