# Tests

Vitest. `node` for `src/main` and `src/types`, `jsdom` for anything in the page.

| Command              | What                                             |
| -------------------- | ------------------------------------------------ |
| `npm test`           | every unit test                                  |
| `npm run test:watch` | the same, watching                               |
| `npm run test:smoke` | `tests/smoke/`: the real agent, the real browser |

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

## `tests/smoke/`, and why it is not in `npm test`

Three suites that need something real behind them. They have their own config
(`tests/vitest.smoke.ts`), their own command, and CI never runs them.

| File               | What it drives                                                          |
| ------------------ | ----------------------------------------------------------------------- |
| `run.test.ts`      | the product: real Chrome, the QA's own agent, a plan walked and judged  |
| `page.test.ts`     | `out/renderer` in plain Chrome, with no bridge: the page must not crash |
| `electron.test.ts` | the packaged window, where `window.gocrash` is the real preload         |
| `stream.test.ts`   | windowless Chrome streamed as MJPEG over loopback, with no agent        |
| `stop.test.ts`     | Stop ends a run while a fake agent is still thinking                    |

`run.test.ts` spends the QA's tokens and needs an agent installed. Run it by hand after touching
the run pipeline.

**A synthetic click is not a click.** Playwright drives the page over CDP, which skips the hit
test the window manager does — so `-webkit-app-region: drag` swallowing a real click is
**invisible to every suite here, Electron included**. What catches it is reading the computed
property off each control, which `page.test.ts` does for the titlebar. Any rule the OS enforces
rather than the page needs the same treatment: assert the declaration, not the behaviour.
