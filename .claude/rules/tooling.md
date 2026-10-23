# Tooling

## Commands

| Command                           | What it does                                           |
| --------------------------------- | ------------------------------------------------------ |
| `npm run dev`                     | opens the app with the renderer on Vite's dev server   |
| `npm run dev:reset`               | the same on an empty data folder: a first run, again   |
| `npm run build`                   | builds main, preload and renderer into `out/`          |
| `npm run preview`                 | opens the app from `out/`                              |
| `npm run package`                 | builds an installer for the current OS into `release/` |
| `npm run typecheck`               | `tsc` over both tsconfigs                              |
| `npm run typecheck:fast`          | the same through `tsgo`, a local accelerator           |
| `npm run lint` / `lint:fix`       | ESLint                                                 |
| `npm run format` / `format:check` | Prettier                                               |
| `npm test` / `test:watch`         | Vitest                                                 |
| `npm run test:smoke`              | the real agent and a real browser — see `testing.md`   |

## Two tsconfigs, and the second one is a guard

`tsconfig.json` only references the other two, so the editor and ESLint see both.

| Config               | Covers                                                                       | Types         |
| -------------------- | ---------------------------------------------------------------------------- | ------------- |
| `tsconfig.node.json` | `src/main`, `src/harness`, `src/shared/types`, `electron/`, `tests/`, config | `node`        |
| `tsconfig.web.json`  | all of `src/` except `src/main` and `src/harness`                            | `vite/client` |

**`tsconfig.web.json` has no Node types.** An `import 'node:fs'` in the page or in `src/shared/types`
does not compile. `src/shared/types` sits in both on purpose: it has to compile in each world.

Both are `composite` so they can be referenced. `typecheck` passes `--composite false` with
`--noEmit`, because a composite project wants to emit declarations.

`noUncheckedIndexedAccess` is on: `table[i]` is `T | undefined`. Prefer `for...of`, `find` and
`??` over raw indexing.

## Versions held back on purpose

| Held           | Because                                           |
| -------------- | ------------------------------------------------- |
| Vite 7         | electron-vite 5 accepts Vite `^5 \|\| ^6 \|\| ^7` |
| plugin-react 5 | 6 requires Vite 8                                 |
| TypeScript 5.9 | typescript-eslint accepts TypeScript `<6.1`       |

Dependabot ignores those majors. Lift them together once electron-vite 6 and typescript-eslint
support the newer versions.

## Two compilers

| Package                      | Role                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `typescript` 5.9             | **source of truth**: `typecheck` and under ESLint      |
| `@typescript/native-preview` | TypeScript 7 as `tsgo`, only a `typecheck:fast` helper |

`tsgo` does not expose the JS API that typescript-eslint's type-aware rules need. When the two
disagree, `tsc` wins.

## Absolute imports

`@/*` → `./src/*`. Four places know about the alias:

| Where           | How                                               |
| --------------- | ------------------------------------------------- |
| `tsc`           | `paths` in both tsconfigs                         |
| `electron-vite` | `resolve.alias` for main, preload and renderer    |
| `vitest`        | `resolve.alias` in `vitest.config.ts`             |
| `eslint`        | `eslint-import-resolver-typescript` reads `paths` |

## Prettier and ESLint

Prettier is the single source of formatting; ESLint does not format.

The rules backing the structure: `max-params: 2`, `member-ordering`, `consistent-type-imports`,
`import-x/order` with the `type` group on top, `../` banned by regex, the process boundaries in
`no-restricted-imports`, `react-hooks` in the page, and `no-restricted-syntax` over
`**/*.class.ts`.

The ESLint config is `eslint.config.mjs` because the package is not `"type": "module"`: Electron's
sandboxed preload has to be CommonJS, and electron-vite picks the output format from that field.

## Husky

`pre-commit` runs `lint-staged`, which applies `prettier --write` to what is staged. ESLint does
not run in the hook; CI covers it.

## CI

`.github/workflows/ci.yml`, on every PR and every push to `main`: lint, typecheck, format, test,
build. It skips the Electron binary download, because nothing in CI launches the app.

## Releasing

`.github/workflows/release.yml`, **`workflow_dispatch` only**, with a `dry_run` input. It
re-verifies, then semantic-release tags, writes `CHANGELOG.md`, bumps `package.json` and creates a
GitHub release. **Nothing is published to npm**: the package is private.

The first release, 0.1.0, counts from `v0.0.0`, a tag on the repository's first commit. Its notes
pass what a GitHub release body takes, so a release whose notes are that long points to its
`CHANGELOG.md` instead (`releaseBodyTemplate`).

**The Windows installer is built by the release.** Once semantic-release tags, a Windows runner
checks the tag out, packs `QAzinho-Setup-<version>.exe` with electron-builder and attaches it to
the release. It goes out unsigned until there is a certificate, so SmartScreen asks once. The
`tag` input builds the installer of a release that already exists, and releases nothing.
**The macOS installers are a workflow of their own**, `macos-installer.yml`, since a Mac runner is
billed at ten times a Linux one and runs only for them. The release calls it once it tags, unless
its `mac` input is off, and dispatching it with a tag builds the installers of a release that
exists. It packs `QAzinho-<version>-arm64.dmg` and `-x64.dmg`, signed with the Developer ID
certificate and notarized with an App Store Connect API key, from five secrets:
`APPLE_CERTIFICATE_P12` (the `.p12`, as base64), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_API_KEY_P8`
(the `.p8` file's text), `APPLE_API_KEY_ID` and `APPLE_API_ISSUER`. With any missing it builds
nothing: an unsigned `.dmg` reads as damaged on a Mac. The Linux AppImage is still to do.

| Commit                               | Effect |
| ------------------------------------ | ------ |
| `feat: ...`                          | minor  |
| `fix: ...`                           | patch  |
| `BREAKING CHANGE: ...` footer        | major  |
| `docs:`, `test:`, `chore:`, `build:` | none   |

## Dependabot

Weekly, npm and github-actions. DevDependencies come grouped with the `chore` prefix.
