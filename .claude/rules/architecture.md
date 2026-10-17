# Architecture

Electron, built by electron-vite. Electron needs three processes, and they run in different
worlds. **`src/` is the app**; the Electron plumbing stays out of the way.

```
src/
├── main/            ← Node + Electron: the window, the filesystem, child processes
├── shared/          ← what every part of the app reaches for
│   ├── types/       ← contracts every side agrees on; imports none of them
│   ├── constants/   ← values every side shares, the IPC channel names included
│   ├── components/  ← atoms, molecules, organisms, templates (components.md)
│   ├── hooks/       ← hooks used across modules
│   └── library/     ← functions used across the page, one per file
├── modules/         ← screens, grouped by domain
├── store/  services/  languages/  styles/
├── app/  index.tsx  index.html
electron/
└── preload/     ← the bridge: exposes window.qazinho through contextBridge, nothing else
```

Everything under `src/` that is not `src/main/` is **the page**: React, no Node.

| Folder             | Runs in             | May import                                                        |
| ------------------ | ------------------- | ----------------------------------------------------------------- |
| `src/main`         | Node                | `electron`, Node builtins, `@/shared/types`, `@/shared/constants` |
| `electron/preload` | a sandboxed preload | `electron`, `@/shared/types`, `@/shared/constants`                |
| the page           | the page            | `@/shared/types` and the rest of the page                         |
| `src/shared/types` | all of the above    | nothing                                                           |

## The boundary is enforced, not agreed

- `tsconfig.web.json` covers the page **without Node's types** and excludes `src/main`:
  `import 'node:fs'` does not compile there.
- ESLint `no-restricted-imports` bans Node builtins and `electron` in the page and in
  `src/shared/types`, and bans the page importing `src/main` or `electron/`.

## Security defaults

Every `BrowserWindow` gets `contextIsolation: true`, `sandbox: true` and `nodeIntegration: false`.

- A sandboxed preload can require only `electron` and a few polyfills. That is why it stays thin.
- `will-navigate` is cancelled unless `isInternalNavigation` says the target is the app itself.
- `window.open` never opens a window: `https:` links go to the system browser, everything else is
  denied.
- **A tracker token never reaches the page.** It crosses to main once, is checked, and is sealed
  with `safeStorage`; the page only ever sees the account it belongs to.
- `index.html` carries a CSP. Loosen one directive with a reason, never the whole policy.

## IPC

- The contract is `IQazinhoApi` in `src/shared/types/`. The preload implements it, and the page reads it
  from `window.qazinho`, typed in `src/global.d.ts`.
- **The channel names live in `src/shared/constants/CHANNELS.ts`**, and only main and the preload read them. A string
  written twice is a call that never answers and never errors. The page never sees a channel: it
  goes through `src/services/`.
- **Expose functions with a purpose, never `ipcRenderer` itself.** A page that can send any
  channel is a page with Node.
- Structured clone carries no functions and no class instances. What crosses is data.
- The page never calls `window.qazinho` from a view. It goes through `src/services/`.

## The harness

**Everything the QA's agent is told lives in `Harness`**, in `src/main/classes/agents/Harness/`:
the system prompt as titled sections, the device brief per platform, and the answer schemas. The
page never writes a prompt: the chat sends the QA's words, the app and the plan, and main adds the
harness once through `--append-system-prompt`. A run gives the agent the device as MCP tools
(`DeviceToolServer`) and no other tool. One agent turn walks a whole case: it acts, corrects
itself, and files each step with the `report` tool as soon as it is judged.

## Heavy work stays off the main process

Agents, Playwright and device drivers will run in child processes (`utilityProcess`), so a slow
emulator never freezes a window. **Video frames never cross IPC**: Chrome runs with no window, and its CDP
screencast reaches the page as MJPEG over loopback (`LiveStream`), drawn by an `<img>`.

## What the main process owns

| Class                                 | What it does                                                           |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `AgentDetector`                       | finds the QA's agent CLIs, the way Orca does: fs probes, no subprocess |
| `AgentRunner`                         | spawns one, streams its JSON, reads a `--json-schema` answer back      |
| `Harness`                             | everything said to the agent: system prompt sections and answer shapes |
| `DeviceToolServer`                    | hands the device to the agent as MCP tools on 127.0.0.1, during a run  |
| `WebDriver`                           | drives Chrome over playwright-core, one profile per workspace          |
| `LiveStream`                          | serves the device's frames as MJPEG on 127.0.0.1, for the device panel |
| `RunCoordinator`                      | walks a plan a case per agent turn: it acts and reports through tools  |
| `ResourceCollector` / `ProcessOwners` | one `ps` sweep, charged to whoever started it                          |
| `Archive`                             | the QA's projects, workspaces and plans, as files on disk              |
| `SetupInstaller`                      | installs an agent CLI or idb on request, streaming each line it prints |
| `IntegrationVault`                    | checks a tracker token and keeps it sealed with `safeStorage`          |

## Dependencies

- `dependencies` ship inside the app and `devDependencies` do not. Everything the page uses,
  React included, is bundled by Vite, so it is a devDependency.
- A runtime dependency in `src/main` ships to every user: today `playwright-core` drives the web
  target, `yaml` writes the plans and `@modelcontextprotocol/sdk` serves the device tools. Think
  twice before a fourth.
