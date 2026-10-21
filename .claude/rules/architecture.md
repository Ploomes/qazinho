# Architecture

Electron, built by electron-vite. Electron needs three processes, and they run in different
worlds. **`src/` is the app**; the Electron plumbing stays out of the way.

```
src/
├── main/            ← Node + Electron: the window, the filesystem, child processes
├── harness/         ← the product harness: what the QA's agent is told, and QAzinho's MCP tools
├── shared/          ← what every part of the app reaches for
│   ├── types/       ← contracts every side agrees on; imports none of them
│   ├── constants/   ← values every side shares, the IPC channel names included
│   ├── components/  ← atoms, molecules, organisms, templates (components.md)
│   ├── hooks/       ← hooks used across modules
│   └── styles/      ← tokens.css, base.css, animations.css
├── modules/         ← screens, grouped by domain
├── store/  services/  languages/
├── recorder/        ← the recorder window: a second, hidden page that encodes a run's video
├── app/  index.tsx  index.html  recorder.html
electron/
└── preload/     ← the bridge: exposes window.qazinho through contextBridge, nothing else
```

Everything under `src/` that is not `src/main/` or `src/harness/` is **the page**: React, no Node.
`src/recorder/` is a page too, a second one with no React, loaded by `recorder.html`.

| Folder             | Runs in             | May import                                                        |
| ------------------ | ------------------- | ----------------------------------------------------------------- |
| `src/main`         | Node                | `electron`, Node builtins, `@/shared/types`, `@/shared/constants` |
| `src/harness`      | Node, inside main   | Node builtins, `@/shared/types`, `@/shared/constants`             |
| `electron/preload` | a sandboxed preload | `electron`, `@/shared/types`, `@/shared/constants`                |
| the page           | the page            | `@/shared/types` and the rest of the page                         |
| `src/shared/types` | all of the above    | nothing                                                           |

## The boundary is enforced, not agreed

- `tsconfig.web.json` covers the page **without Node's types** and excludes `src/main` and
  `src/harness`:
  `import 'node:fs'` does not compile there.
- ESLint `no-restricted-imports` bans Node builtins and `electron` in the page and in
  `src/shared/types`, and bans the page importing `src/main` or `electron/`.

## Security defaults

Every `BrowserWindow` gets `contextIsolation: true`, `sandbox: true` and `nodeIntegration: false`.

- A sandboxed preload can require only `electron` and a few polyfills. That is why it stays thin,
  and why there is one: a second entry would share a chunk it cannot require. The recorder window
  opens with `RECORDER_ARGUMENT`, and the same preload hands it `window.qazinhoRecorder` instead
  of `window.qazinho`.
- `will-navigate` is cancelled unless `isInternalNavigation` says the target is the app itself.
- `window.open` never opens a window: `https:` links go to the system browser, everything else is
  denied.
- **An MCP sign-in never passes through QAzinho.** Figma's MCP lives in the QA's own agent,
  Claude Code or Codex: QAzinho adds it there and runs the agent's own sign-in, and the token
  stays with the agent. Each agent's commands are a recipe in `MCP_RECIPES`.
  - Claude Code signs in only from its `/mcp` screens. `AgentTerminal` opens them in a terminal
    nobody sees (`/usr/bin/expect`, on every Mac) and `nextMcpMove` presses the keys a QA would.
    It answers yes to the folder trust question only for QAzinho's own agent folder.
  - The page Claude Code asks `$BROWSER` to open is caught and opened by QAzinho, so the popup
    can open it again. Codex prints its page (`codex mcp login`).
  - Each step reaches the page as `McpSignInProgress`. Terminal (`claude "/mcp"`) stays as the
    way round when the hidden screens are not what `nextMcpMove` knows.
- **An agent's sign-in never passes through QAzinho either.** `AgentLogin` runs the agent's own
  login (`claude auth login`, `codex login`) out of sight and reports each step.
  - `LinkCatcher` hands the agent a `$BROWSER` that writes the page down, and QAzinho opens it
    in the QA's browser. Codex opens its own, and QAzinho only points at it.
  - A code the page shows goes to the agent's stdin. What the agent gets stays with the agent.
- **Nothing asks the QA to type a command.** A flow that runs a CLI runs it out of sight and shows
  its steps in `StepsPopup`. Terminal is only a way round after a failure.
- **A tracker token never reaches the page.** It crosses to main once, is checked, and is sealed
  with `safeStorage`; the page only ever sees the account it belongs to.
- **A variable's value never leaves main once sealed.** `VariableVault` keeps each project's
  variables in one file sealed with `safeStorage`, and no channel hands a value back: the page
  and the agents know a name and what it holds.
  - The page sends a value only to save it, from the project's window or the window an agent
    asks for (`VariablesModal`); no app tool carries one, and the Estagiário hears only names.
  - A run reaches the device through `variablePort`: a `${NAME}` is typed as its value, every
    value that shows is read back as its name, in the screen and in why an action failed, and
    a recipe keeps the name, never a locator that holds a value.
  - On Linux, Electron seals with a fixed key when there is no GNOME Keyring or KWallet, and
    still says it can encrypt: `isSealable` refuses that, for variables and Jira's token.
- **GitHub's login never passes through QAzinho either.** QAzinho talks to GitHub through the
  QA's own GitHub CLI (`GithubCli`), the way it drives the QA's agent, and keeps no token.
  - Connecting runs gh's device flow out of sight; the popup shows the one-time code and opens
    GitHub. A gh already signed in connects at once, and one missing `repo` or `read:org` is asked
    for again with `gh auth refresh`.
  - gh is light, so QAzinho installs it through Homebrew when the QA asks.
  - Disconnecting only makes QAzinho stop using it: gh stays signed in for the QA's other tools.
- **The agent runs in QAzinho's own agent folder** (`PATHS.agentHome`), chat and runs alike, so
  no project's `.claude` settings reach the QA's agent. Claude Code also runs with the QA's own
  hooks off (`AGENT_RUN.settings`): a hook that rewrites commands, such as rtk's, broke every
  build's permissions. A company's managed hooks still run.
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

**Everything the QA's agent is told lives in `src/harness/`**, a product harness that sits on top
of the agent's own (Claude Code's). Main runs it, and the agent's CLI stays the engine: no SDK. It
answers one question per channel, for a target `{ role, platform }`:

| Channel | Where                    | Becomes                                                   |
| ------- | ------------------------ | --------------------------------------------------------- |
| context | `context/corpus/**/*.md` | the system prompt, through `--append-system-prompt`       |
| tools   | `tools/`                 | QAzinho's MCP server and the `--allowedTools` a role gets |
| schemas | `schemas/`               | the shape an answer must take, through `--json-schema`    |

- **The corpus is prose in `.md`, one `## Title` section per file.** Where a file lives says who
  reads it: `universal/` every call, `role/<role>/` one role (`chat`, `runner`, `explorer`,
  `assistant`, `builder`),
  `platform/<x>.md` one device. The frontmatter's `order` sorts a layer. Layers go from the most stable to the least.
  `{{app}}` is filled per call; a placeholder nothing fills throws.
- **A chat's system prompt is the corpus alone.** Claude Code keeps the system prompt a session
  started with and ignores a new `--append-system-prompt` on `--resume`. What a message adds (the
  workspace, its latest runs, what `AppPeek` saw, the @ references) opens the message inside
  `<qazinho>`, and only what changed since that session last read it (`changedSections`).
- **A run is walked by agents of its own.** Each case gets a fresh agent with the runner's
  prompt and the device tools, and nothing of the chat.
- **A bug seen again lands on the one open.** Each run carries the workspace's bugs
  (`IStartRun.bugs`), and every case's agent and the explorer hear the latest of them
  (`describeKnownBugs`). `bug` and `report` take `sameAs` with one of their ids, kept only when
  the run was told of it (`keptBugId`).
  - The page lands a failure or a finding with `catchBug`: on the bug named, else the bug its
    plan step failed for, else one with the same title, else as a new bug.
  - The bug keeps each sighting, with its run, step, moment and screen; a run that already caught
    it changes nothing.
- **A case that passed is walked again without the agent.** Its run records each step's
  actions, and the agent reports with each pass a `proof`: words on screen that would not be
  there had it failed.
  - A case whose every step passed with a proof becomes a recipe, kept in the workspace's
    folder (`recipes.json`), keyed to what the case says and the kind of target
    (`fingerprintOf`). A web step also keeps the Playwright locator it used, and a drag the
    one it dropped on.
  - The next run walks a case with a recipe on the device with no agent and checks each proof
    (`replayCase`): it costs nothing and takes seconds. When a proof does not show, the case
    starts over with the agent, which records it again, and its steps read as healed.
  - "Run with the agent" walks every case with the agent. The report says "no AI" or
    "healed" on each case, and `CodeExport` turns the recipes into a Playwright file or a
    Maestro flow per case. The chat's agent learns how the runs
    went from the history the next message carries (`runHistoryOf`): the latest run step by
    step, the ones before by what broke.
- **An exploration is walked by one agent with no plan** (`role/explorer/`). It gets the device
  for a set time with `screen`, `bug` and `finish` in place of `report` (`TOOLS_LEFT_OUT`):
  - Each action answers with the time left, and none is carried out once it is up; a finish
    with more than a third of it left is sent back once (`earlyFinish`).
  - Each screen it notes is a step of one case (`EXPLORATION.caseId`), each bug a finding on
    the screen noted last, and its finish the plan it suggests, which the chat keeps on a card
    until the QA takes it into the plan (`takeSuggestion`). The chat's agent hears it in the
    run history.
- **The tools are granted per role** (`TOOL_GRANTS`). The runner and the explorer get the
  device, the assistant gets the app, and the chat gets nothing: it runs with every tool taken
  away. `McpHost` serves the tools on loopback, one address per workspace for the length of a
  run, and one under the `~assistant` scope while the assistant answers.
- **The Estagiário in the corner is an agent of its own** (`role/assistant/`). It does in QAzinho
  what the QA does by hand, through the app tools (`servers/app/`), and talks about any project,
  workspace, run or bug:
  - Each message opens with what is on screen and how QAzinho is now (`describeScreen`,
    `describeApp`), sent again only when it changed. The page builds that snapshot.
  - A tool call is read against its zod schema into an `AppToolCall`, which the page carries out
    through the same stores and services the QA's clicks use (`performAppTool`), and the answer
    goes back in words. Main's `AppBridge` hands the call over and waits for the answer.
  - The compiler holds the zod schemas and the `AppToolCall` type to each other: a tool whose
    schema and type drift apart does not build.
  - Deleting and disconnecting wait on a card the QA answers in the chat, for up to five minutes
    (`ASSISTANT_WAIT`). The MCP config tells the agent a call may take that long: Claude Code
    reads the server's `timeout`, and Codex `tool_timeout_sec`.
  - A build path is made whole and checked on disk in main before the page hears of it. A
    tracker's token is still typed by the QA in Settings, never in the chat, and the composer
    holds back a message that carries one (`secretIn`) until the QA takes it out or insists.
  - A plan is written in the workspace's own chat, never in the Estagiário's:
    `ask_workspace_chat` sends the QA's request there in their name and opens it. It refuses
    while that chat answers, while a run walks, or while its questions wait on the QA, which
    `workspace_details` reads back so the Estagiário helps answer them.
  - The chat and its session outlive a restart (`keptOf`): the latest messages, with nothing
    left going.
  - It never covers the device. Its chat opens beside an open device panel, the composer leaves
    room for its button when the panel is shut (`dockRoomOf`), and the steps scroll past it.
- **The app builds from its own code, by the QA's agent** (`role/builder/`). A project's Android
  or iOS card, or the assistant's `build_app`, builds the app from a branch of one of the
  project's repositories, with no terminal:
  - Main's `AppBuilder` pins the branch to a commit and unpacks it into `builds/work/<build>`.
  - The agent gets Bash, Read, Grep, Glob, Edit and Write, and the build commands it may run
    unasked, on that folder alone; never rm, git or curl. Codex works in a workspace-write
    sandbox with the network on, its caches kept inside the folder.
  - Its environment carries the QA's PATH, the Android SDK, Android Studio's JDK and `CI=1`.
  - QAzinho checks what it made: an .apk that is a zip, or an .app the simulator runs and not
    one for a device. It is found where the agent said, or in the usual output folders. It is
    kept under `builds/apps/<project>`, the copy is deleted, and it becomes the project's target.
  - Each step, the agent's words and commands (with the folder said as `.`), and how the build
    ended reach the page as `IBuildEvent`.
- **The code plans; the QA says what the app should do** (`role/chat/code.md`). A project names
  its GitHub repositories, each with a base branch. `/code` in the chat picks one of them and a
  branch, and the agent reads that branch while it plans:
  - Main's `CodeCopies` pins the branch and the base to commits, unpacks the branch's tarball
    into the workspace's own folder under `code/`, and keeps the diff against the base. The base
    branch itself means the whole app, with nothing to compare.
  - The message opens with a section on the copy: where it sits, the commits, the files changed
    and where the diff is (`describeCode`).
  - Claude Code gets `Read`, `Grep` and `Glob` on that folder alone (`--tools`, `--add-dir`);
    anything outside it is refused. Codex reads with its own read-only sandbox.
  - The copy is deleted once a plan comes back, when the workspace goes, and on the next start.
    The plan keeps where it came from (`planSource`), and the agent hears once that the copy is
    gone.
- **The harness never imports `src/main`.** What it needs from a device is a port in its types
  (`IDevicePort`), and main hands it the driver. ESLint enforces it both ways: the page never
  imports the harness, and the harness never imports main or the page.
- **Every shape the agent fills is one zod schema**: the chat answer and each tool's arguments. It
  becomes the JSON Schema the agent reads (`--json-schema`, or the MCP tool list), and the same
  schema reads back what the agent sent, with the message the agent gets when it breaks a rule.
  `jsonSchemaOf` drops the `$schema` key, which makes Claude Code ignore a schema in silence.
- **A plan comes out of a conversation, never out of a guess** (`role/chat/planning.md`), the way
  the Ploomes harness builds a screen:
  - Look: before a chat message on a web target, `AppPeek` opens the app and the agent reads
    what its page showed. On an Android or iOS target with no plan yet, `PhonePeek` opens the
    app on the emulator or simulator, with no window, and the agent reads its first screen; the
    chat says so while it waits.
  - Ask: one round of closed questions in the answer's `questions`, each with two to four
    options and the QA's own words always open. The page draws it as `QuestionRound` and sends
    the answers back as the next message.
  - A secret is never asked in words (`role/chat/variables.md`): an option whose `variables`
    lists what is missing opens the window for the values, and the next message names the
    variables kept, with the project's variables in a section of their own.
  - Confirm: the plan about to be written, with one option alone.
  - Write: `plan` is filled only once the QA picked that option.
- **The prompts are pinned.** `src/harness/__tests__/__prompts__/` holds what the agent reads for each
  role and platform; changing what the agent is told is a diff of those files.

## Heavy work stays off the main process

Agents, Playwright and device drivers will run in child processes (`utilityProcess`), so a slow
emulator never freezes a window. **Video frames never cross IPC**: Chrome runs with no window, and its CDP
screencast reaches the page as MJPEG over loopback (`LiveStream`), drawn by an `<img>`.

- Chrome renders at the QA's pixel ratio, capped at 2, and its window is sized around the
  viewport (`Browser.setContentsSize`), or a frame cuts the foot of the page off.
- The stream runs at 1x in the panel, and at the pixel ratio only while the device is in focus
  (`focusDevice`): a 2x frame costs about three times the CPU on a page that animates.
- Chrome keeps a window at least 500px wide, so a phone-sized page streams framed wider, and
  `DeviceScreen` cuts the stream to the viewport's shape.
- A phone has no window either: the emulator boots with `-no-window` (`bootArgs`) and a
  simulator through `simctl`, without Simulator.app. The QA sees it only in the device panel.

**Every run is recorded, and its video never crosses IPC either.**

- A browser is recorded from its live stream. `RunRecorder` opens a hidden window,
  `src/recorder/`, that reads the same MJPEG over loopback, each frame stamped with when it was
  captured and the screen's shape. It crops a phone-sized page the way `DeviceScreen` does,
  encodes H.264 with WebCodecs, and hands the MP4 back in pieces main writes by position.
- A phone records itself: a simulator with `simctl io recordVideo`, an emulator with its console's
  `screenrecord`, as WebM, for up to the half hour it allows. It stops before the device closes.
- `ReplayServer` serves the file to the page's `<video>` on loopback, in the byte ranges a video
  asks for to seek. The CSP lets media in from loopback, and nothing else.
- Main stamps each step and finding with when it heard it, so the run's timeline places every
  case, step and bug in the video (`replayTimelineOf`).
- **The app's own windows leave the recorder out** (`appWindows`): a broadcast, a dialog or the
  dock click never lands on it.
- **A browser's requests are kept beside its video** (`network.json`). `WebDriver` notes each one
  Chrome makes, and `privateUrlOf` writes a variable's value in its address as its name and a
  secret-looking query value as dots before it is kept. A phone keeps none yet.
- The page draws them under the video (`ReplayNetwork`), and makes the video again to download
  them drawn in: `ReplayComposer` reads the run's MP4 (`readMp4`), decodes it with WebCodecs,
  draws the strip on each frame (`drawNetworkStrip`), holds the picture while the screen stood
  still, and encodes one MP4. The file crosses IPC whole, once each way (`replayVideo`,
  `saveVideo`); its frames never do.

## What the main process owns

Besides the harness's `Harness` and `McpHost`, which main builds and wires:

| Class                                 | What it does                                                                             |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| `AgentDetector`                       | finds the QA's agent CLIs, the way Orca does: fs probes, no subprocess                   |
| `AgentRunner`                         | spawns Claude Code or Codex, each in its own dialect, and reads the answer back          |
| `WebDriver`                           | drives Chrome over playwright-core, one profile per workspace                            |
| `LiveStream`                          | serves the device's frames as MJPEG on 127.0.0.1, for the device panel                   |
| `AppPeek`                             | opens a web target for a moment before the chat, and reads what its page shows           |
| `PhonePeek`                           | opens a phone app on the emulator or simulator before a plan, and reads its first screen |
| `RunCoordinator`                      | walks a plan a case per agent turn, each on the app opened anew, or from its recipe      |
| `CodeExport`                          | writes the recorded cases as Playwright or Maestro code, in a folder the QA picks        |
| `ResourceCollector` / `ProcessOwners` | one `ps` sweep, charged to whoever started it                                            |
| `Archive`                             | the QA's projects, workspaces and plans, as files on disk                                |
| `SetupInstaller`                      | installs an agent CLI, idb or gh on request, streaming each line it prints               |
| `IntegrationVault`                    | connects the trackers: GitHub as gh's account, Jira's token sealed by `safeStorage`      |
| `AgentTerminal`                       | runs an agent's full-screen interface out of sight: reads it, presses its keys           |
| `AgentMcp`                            | adds an MCP server to the QA's agent and signs it in there, step by step                 |
| `AgentLogin`                          | signs the QA's agent in through its own login, step by step                              |
| `LinkCatcher`                         | gives an agent a `$BROWSER` that writes down the pages it wants opened                   |
| `RunRecorder`                         | records a run's live stream into an MP4, through the hidden recorder window              |
| `ReplayServer`                        | serves a run's recording to the page's `<video>` on 127.0.0.1, with ranges               |
| `RunAlerts`                           | calls the QA back when a run ends while they are away: a notification, a badge           |
| `GithubCli`                           | talks to GitHub through the QA's own gh: status, device-flow sign-in, API, tar           |
| `GithubRepos`                         | lists the QA's repositories and a repository's branches, kept for a little while         |
| `CodeCopies`                          | copies a branch for the agent to read while it plans, with its diff, then drops it       |
| `AssistantAgent`                      | asks the QA's agent as the Estagiário, with the app tools served for the turn            |
| `AppBridge`                           | hands each app tool call to the page and waits for what it did                           |
| `AppBuilder`                          | builds an .apk or .app from a branch with the QA's agent, and keeps what it made         |
| `UsageReader`                         | reads the account's limits through Claude Code's own `/usage`, which spends nothing      |
| `VariableVault`                       | keeps each project's variables sealed by the keychain; only a run reads a value          |

## Dependencies

- `dependencies` ship inside the app and `devDependencies` do not. Everything the page uses,
  React included, is bundled by Vite, so it is a devDependency.
- A runtime dependency in `src/main` ships to every user: today `playwright-core` drives the web
  target, `yaml` writes the plans, `@modelcontextprotocol/sdk` serves the device tools, and `zod`
  shapes the answers (the MCP SDK ships it anyway). Think twice before a fifth.
