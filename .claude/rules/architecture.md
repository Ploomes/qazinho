# Architecture

Electron, built by electron-vite. Three processes, and one folder they all share.

```
src/
├── main/       ← Node + Electron: windows, the filesystem, child processes
├── preload/    ← the bridge: exposes window.gocrash through contextBridge, nothing else
├── renderer/   ← React: a web page, sandboxed
└── shared/     ← contracts every process agrees on; imports none of them
```

| Folder     | Runs in             | May import                            |
| ---------- | ------------------- | ------------------------------------- |
| `main`     | Node                | `electron`, Node builtins, `@/shared` |
| `preload`  | a sandboxed preload | `electron`, `@/shared`                |
| `renderer` | the page            | `@/shared`                            |
| `shared`   | all of the above    | none of the three                     |

## The boundary is enforced, not agreed

- `tsconfig.web.json` covers `renderer` and `shared` **without Node's types**: `import 'node:fs'`
  does not compile there.
- ESLint `no-restricted-imports` bans Node builtins and `electron` in `renderer` and `shared`,
  and bans importing another process's folder anywhere.

## Security defaults

Every `BrowserWindow` gets `contextIsolation: true`, `sandbox: true` and `nodeIntegration: false`.

- A sandboxed preload can require only `electron` and a few polyfills. That is why it stays thin.
- `will-navigate` is cancelled unless `isInternalNavigation` says the target is the app itself.
- `window.open` never opens a window: `https:` links go to the system browser, everything else is
  denied.
- `index.html` carries a CSP. Loosen one directive with a reason, never the whole policy.

## IPC

- The contract is `GocrashApi` in `src/shared/types/`. The preload implements it, and the renderer
  reads it from `window.gocrash`, typed in `src/renderer/global.d.ts`.
- **Expose functions with a purpose, never `ipcRenderer` itself.** A renderer that can send any
  channel is a renderer with Node.
- Structured clone carries no functions and no class instances. What crosses is data.

## Heavy work stays off the main process

Agents, Playwright and device drivers will run in child processes (`utilityProcess`), so a slow
emulator never freezes a window. **Video frames never cross IPC**: an emulator stream reaches the
page over a local WebSocket or WebRTC.

## Dependencies

- `dependencies` ship inside the app and `devDependencies` do not. Everything the renderer uses,
  React included, is bundled by Vite, so it is a devDependency.
- A runtime dependency in `main` ships to every user. Today there are none. Think twice.
