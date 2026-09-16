# Architecture

Electron, built by electron-vite. Electron needs three processes, and they run in different
worlds. **`src/` is the app**; the Electron plumbing stays out of the way.

```
src/
├── main/        ← Node + Electron: the window, the filesystem, child processes
├── types/       ← contracts every side agrees on; imports none of them
├── constants/   ← values every side shares, the IPC channel names included
├── components/  ← atoms, molecules, organisms, templates (components.md)
├── modules/     ← screens, grouped by domain
├── hooks/  store/  services/  styles/
├── app/  index.tsx  index.html
electron/
└── preload/     ← the bridge: exposes window.gocrash through contextBridge, nothing else
```

Everything under `src/` that is not `src/main/` is **the page**: React, no Node.

| Folder             | Runs in             | May import                                          |
| ------------------ | ------------------- | --------------------------------------------------- |
| `src/main`         | Node                | `electron`, Node builtins, `@/types`, `@/constants` |
| `electron/preload` | a sandboxed preload | `electron`, `@/types`, `@/constants`                |
| the page           | the page            | `@/types` and the rest of the page                  |
| `src/types`        | all of the above    | nothing                                             |

## The boundary is enforced, not agreed

- `tsconfig.web.json` covers the page **without Node's types** and excludes `src/main`:
  `import 'node:fs'` does not compile there.
- ESLint `no-restricted-imports` bans Node builtins and `electron` in the page and in
  `src/types`, and bans the page importing `src/main` or `electron/`.

## Security defaults

Every `BrowserWindow` gets `contextIsolation: true`, `sandbox: true` and `nodeIntegration: false`.

- A sandboxed preload can require only `electron` and a few polyfills. That is why it stays thin.
- `will-navigate` is cancelled unless `isInternalNavigation` says the target is the app itself.
- `window.open` never opens a window: `https:` links go to the system browser, everything else is
  denied.
- `index.html` carries a CSP. Loosen one directive with a reason, never the whole policy.

## IPC

- The contract is `IGocrashApi` in `src/types/`. The preload implements it, and the page reads it
  from `window.gocrash`, typed in `src/global.d.ts`.
- **The channel names live in `src/constants/CHANNELS.ts`**, and only main and the preload read them. A string
  written twice is a call that never answers and never errors. The page never sees a channel: it
  goes through `src/services/`.
- **Expose functions with a purpose, never `ipcRenderer` itself.** A page that can send any
  channel is a page with Node.
- Structured clone carries no functions and no class instances. What crosses is data.
- The page never calls `window.gocrash` from a view. It goes through `src/services/`.

## Heavy work stays off the main process

Agents, Playwright and device drivers will run in child processes (`utilityProcess`), so a slow
emulator never freezes a window. **Video frames never cross IPC**: Chrome runs with no window, and its CDP
screencast reaches the page as MJPEG over loopback (`LiveStream`), drawn by an `<img>`.

## What the main process owns

| Class                                 | What it does                                                           |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `AgentDetector`                       | finds the QA's agent CLIs, the way Orca does: fs probes, no subprocess |
| `AgentRunner`                         | spawns one, streams its JSON, reads a `--json-schema` answer back      |
| `WebDriver`                           | drives Chrome over playwright-core, one profile per workspace          |
| `LiveStream`                          | serves the device's frames as MJPEG on 127.0.0.1, for the device panel |
| `RunCoordinator`                      | walks a plan: describe, act, shoot, judge, one step at a time          |
| `ResourceCollector` / `ProcessOwners` | one `ps` sweep, charged to whoever started it                          |
| `Archive`                             | the QA's projects, workspaces and plans, as files on disk              |

## Dependencies

- `dependencies` ship inside the app and `devDependencies` do not. Everything the page uses,
  React included, is bundled by Vite, so it is a devDependency.
- A runtime dependency in `src/main` ships to every user: today `playwright-core` drives the web
  target and `yaml` writes the plans. Think twice before a third.
