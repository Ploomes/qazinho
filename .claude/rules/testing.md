# Tests

Vitest, `node` environment.

| Command              | What              |
| -------------------- | ----------------- |
| `npm test`           | everything        |
| `npm run test:watch` | everything, watch |

## `__tests__/` next to the code

```
src/main/library/
├── is-internal-navigation.ts
└── __tests__/is-internal-navigation.test.ts
```

A test lives next to what it tests, not next to the folder that contains it. Vitest picks up
`src/**/__tests__/**/*.test.{ts,tsx}`, and electron-vite never bundles them because nothing
imports them.

## Rules

- **No module mocking.** Hand-written fakes over a port. If a test needs `vi.mock`, a dependency
  has leaked.
- **Keep `electron` out of `library/`.** A function that takes plain values is tested with plain
  values; the Electron call stays in the class or in `index.ts` that uses the function. That is
  why `isInternalNavigation` takes two strings and not a `WebContents`.
- **Every function exported from `library/` has a test.** The caller exercises one path; the
  function has several.
- **Every constant table has an edge test.**
- **Test names describe behaviour, not methods.** `'another port on localhost is another origin'`,
  never `'isInternalNavigation() returns false'`.
- **Tests do not use the network**, and do not boot an emulator, a simulator or a browser. What
  drives a real device gets its own suite when it exists.

## What must always be covered

- **The navigation guard.** Same origin, another port, a hash on the packaged page, another file
  on disk, `javascript:` and a string that is not a URL.
