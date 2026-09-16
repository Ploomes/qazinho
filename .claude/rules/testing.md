# Tests

Vitest. `node` for `src/main` and `src/types`, `jsdom` for anything in the page.

| Command              | What                                       |
| -------------------- | ------------------------------------------ |
| `npm test`           | every unit test                            |
| `npm run test:watch` | the same, watching                         |
| `npm run test:smoke` | `smoke/`: the real agent, the real browser |

## `__tests__/` next to the code

```
src/main/library/
├── isInternalNavigation.ts
└── __tests__/isInternalNavigation.test.ts

src/components/atoms/Button/hooks/useButtonViewModel/
├── index.ts
└── __tests__/useButtonViewModel.test.ts
```

A test lives next to what it tests, not next to the folder that contains it. Vitest picks up
`src/**/__tests__/**/*.test.{ts,tsx}`, and electron-vite never bundles them because nothing
imports them.

## What must have a test

- **Every view model.** One `describe` per exposed function, and the cases that matter: the
  happy path, the path that must **not** happen, and the edge.
- **Every function exported from `library/`.** The caller exercises one path; the function has
  several.
- **Every constant table**, at its edges.
- **The navigation guard**: same origin, another port, a hash on the packaged page, another file
  on disk, `javascript:` and a string that is not a URL.

A view is not tested. It holds no logic, so there is nothing to assert that the view model does
not already cover.

## Rules

- **No module mocking.** Hand-written fakes over a port. If a test needs `vi.mock`, a dependency
  has leaked. A collaborator arrives through props or through the view model's arguments.
- **Keep `electron` out of `library/`.** A function that takes plain values is tested with plain
  values; the Electron call stays in the class or in `index.ts`. That is why
  `isInternalNavigation` takes two strings and not a `WebContents`.
- **Test names describe behaviour, not methods.** `'another port on localhost is another
origin'`, never `'isInternalNavigation() returns false'`.
- **Tests do not use the network**, and do not boot an emulator, a simulator or a browser.
- A page test file declares its environment at the top: `// @vitest-environment jsdom`.

## `smoke/`, and why it is not in `npm test`

`smoke/run.test.ts` is the one test that proves the product: it serves a page on localhost, drives
real Chrome through `RunCoordinator` and asks the QA's own agent to judge what it sees. It spends
the QA's tokens and needs an agent installed, so it has its own config (`vitest.smoke.ts`), its
own command, and CI never runs it. Run it by hand after touching the run pipeline.
