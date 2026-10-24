# Contributing

## Setup

```bash
git clone --recurse-submodules https://github.com/Salve-Software/qazinho.git
npm install
npm run dev
```

The harness lives in its own repository, checked out as a submodule in
`packages/qazinho-harness`; `npm install` builds it. In a clone made without
`--recurse-submodules`, run `git submodule update --init --recursive` first.

## Before opening a PR

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
npm run build
```

CI runs all of those.

## Branches and commits

Branches are `feat/<description>` or `fix/<description>`. Commits are
[conventional](https://www.conventionalcommits.org/): `feat`, `fix`, `docs`, `test`, `refactor`,
`style`, `chore`, `ci`, `build`.

The version is computed from those commits, so the type is not cosmetic: `feat` cuts a minor,
`fix` cuts a patch, a `BREAKING CHANGE:` footer cuts a major, and everything else cuts nothing.

Keep commits small and single-purpose. Never mix unrelated changes.

## How the code is expected to look

`.claude/rules/` is the real style guide, and it is short:

| Rule                                            | Where                     |
| ----------------------------------------------- | ------------------------- |
| processes, IPC, security defaults               | `rules/architecture.md`   |
| one class per folder, one type per file, naming | `rules/code-structure.md` |
| comments: one line or none                      | `rules/comments.md`       |
| what a test has to cover                        | `rules/testing.md`        |
| the two tsconfigs, CI, releasing                | `rules/tooling.md`        |

Two that catch people out:

- **The renderer cannot import Node or Electron.** It is a web page. `tsconfig.web.json` has no
  Node types, so a slip fails the typecheck instead of someone's runtime.
- **Every function exported from a `library/` folder has a test.**

## Releasing

Manual, through `workflow_dispatch` on the `Release` workflow. Merging to `main` releases nothing.
