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
│   └── styles/      ← tokens.css, base.css, animations.css
├── modules/         ← screens, grouped by domain
├── store/  services/  languages/
├── recorder/        ← the recorder window: a second, hidden page that encodes a run's video
├── app/  index.tsx  index.html  recorder.html
electron/
└── preload/     ← the bridge: exposes window.qazinho through contextBridge, nothing else
packages/
└── qazinho-harness/  ← the product harness, a git submodule of its own repository
```

Everything under `src/` that is not `src/main/` is **the page**: React, no Node.
`src/recorder/` is a page too, a second one with no React, loaded by `recorder.html`.

| Folder             | Runs in                 | May import                                                                     |
| ------------------ | ----------------------- | ------------------------------------------------------------------------------ |
| `src/main`         | Node                    | `electron`, Node builtins, the harness, `@/shared/types`, `@/shared/constants` |
| the harness        | Node, bundled into main | its own repository: nothing of the desktop                                     |
| `electron/preload` | a sandboxed preload     | `electron`, `@/shared/types`, `@/shared/constants`                             |
| the page           | the page                | `@/shared/types` and the rest of the page                                      |
| `src/shared/types` | all of the above        | nothing but the harness's pure `/contract`                                     |

## The boundary is enforced, not agreed

- `tsconfig.web.json` covers the page **without Node's types** and excludes `src/main`:
  `import 'node:fs'` does not compile there.
- ESLint `no-restricted-imports` bans Node builtins and `electron` in the page and in
  `src/shared/types`, and bans the page importing `src/main`, `electron/` or the harness. Only
  `src/shared/types` and `src/shared/constants` import the harness's `/contract`.

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
  with `safeStorage`; the page only ever sees the account it belongs to. Main unseals Jira's to
  call Jira (`IntegrationVault.jira`).
- **A variable's value never leaves main once sealed.** `VariableVault` keeps each project's
  variables in one file sealed with `safeStorage`, and no channel hands a value back: the page
  and the agents know a name and what it holds.
  - The page sends a value only to save it, from the project's window or the window an agent
    asks for (`VariablesModal`), or as the secret answer to a run's question, which only that
    run types unless the QA keeps it. No app tool carries one, and the Estagiário hears only
    names.
  - A run reaches the device through `variablePort`: a `${NAME}` is typed as its value, every
    value that shows is read back as its name, in the screen and in why an action failed, and
    a recipe keeps the name, never a locator that holds a value.
  - A team's suite reads a variable from the environment of the Playwright QAzinho starts; it
    is never written to the suite's `.env`, or anywhere else.
  - On Linux, Electron seals with a fixed key when there is no GNOME Keyring or KWallet, and
    still says it can encrypt: `isSealable` refuses that, for variables and Jira's token.
  - A password or a token written out in a plan is a variable waiting to be kept: the Plan tab
    names the case that writes it and seals it in one click, writing `${NAME}` in its place
    (`writtenSecretsOf`), or takes the QA's word that it is no secret (`plainValues`). Both
    chats hold back a message that carries one (`secretIn`).
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

## The workspace

A workspace is three columns: the sidebar, the chat in the middle, and a panel beside it
(`SidePanel`) whose tabs are the plan, the device (`DeviceView`), the runs and the bugs.

- The chat is always there; the QA picks the panel's tab (`panelTab`), and a run that starts is
  the one thing that turns it, to the device. `selectTab('chat')` only brings the chat back.
- The panel keeps the width the QA drags it to, narrowed so the chat keeps `SHELL.centerMinWidth`
  (`panelWidthOf`). It folds to a rail named after its tab, or widens over the chat, which stays
  mounted, hidden and inert, so a draft is never lost.
- The Estagiário hears the tab beside the chat, or that the panel is hidden (`describeScreen`).
- The sidebar folds to a rail of each workspace's platform and state (⌘B), kept in the settings
  across a restart; the chat and the panel measure their room from its width (`useSidebarWidth`).

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

**Everything the QA's agent is told lives in the harness**, a product harness that sits on top of
the agent's own (Claude Code's), in a repository of its own that QAzinho Pro's API runs too
(`qazinho-harness`). Main runs it, and the agent's CLI stays the engine: no SDK. It answers one
question per channel, for a target `{ role, platform }`:

| Channel | Where                    | Becomes                                                   |
| ------- | ------------------------ | --------------------------------------------------------- |
| context | `context/corpus/**/*.md` | the system prompt, through `--append-system-prompt`       |
| tools   | `tools/`                 | QAzinho's MCP server and the `--allowedTools` a role gets |
| schemas | `schemas/`               | the shape an answer must take, through `--json-schema`    |

- **The desktop takes it as a package.** `packages/qazinho-harness` is a git submodule, depended
  on with `file:` (`@salve-software/qazinho-harness`) and built by `npm run harness:build`, which
  `postinstall` runs. electron-vite bundles its `dist/` into main, the corpus included, while zod,
  yaml and the MCP SDK stay the app's own dependencies. Its own `.claude/rules/` describe it; what
  follows is what the desktop relies on.
  - **The types main shares with the page come from the harness's `/contract`**: each file in
    `src/shared/types` that the harness also reads re-exports one type from it, so the zod
    schemas, main and the page hold one definition. `VARIABLE_NAME` comes the same way.
  - **Moving the harness** is a commit that moves the submodule and runs `npm run harness:build`;
    a change to what the agent is told shows up first as a diff of the harness's pinned prompts.
- **The corpus is prose in `.md`, one `## Title` section per file.** Where a file lives says who
  reads it: `universal/` every call, `role/<role>/` one role (`chat`, `runner`, `explorer`,
  `assistant`, `builder`, `automator`, `reporter`),
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
  - "Run everything with the agent", in the run button's menu (`RunButton`), walks every case
    with the agent; each way says in the menu what it does. The report says "no AI" or
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
- **The agent asks the QA mid-run** (`ask_qa`, `asking-the-qa.md` in `role/runner/` and
  `role/explorer/`). The call holds until the QA answers:
  - `RunCoordinator` keeps the question (`IOpenQuestion`) and tells the page (`asked`). The
    page answers through `answerRun`, and how it ended comes back as `answered`: the QA's words,
    a secret by its name, no answer once `RUN_WALK.askWaitMs` (15 minutes) passed, or a stop.
  - The agent's turn clock stops while it waits (`AgentRunner.hold`), the explorer's clock
    moves on by the wait, and the MCP config tells the agent a call may take that long: Claude
    Code held one for 16 minutes.
  - A secret crosses to main once and becomes a variable of the run, typed by `variablePort`:
    the agent reads `${NAME}`, and the page only ever the name. The project keeps it when the
    QA says so (`keepVariable`), and a case that typed one given for that run alone keeps no
    recipe.
  - The QA's words reach the agent with any variable's value read back as its name.
  - The page holds the question on the live run, draws it as `AskCard` at the end of the chat,
    and keeps how it ended in the run's section (`AskNote`) and on its step in Runs.
- **The tools are granted per role** (`TOOL_GRANTS`). The runner and the explorer get the
  device, the assistant gets the app, and the chat gets its sources: `read_jira_story`,
  `search_confluence` and `read_confluence_page` (`servers/sources/`), plus the reading tools
  of the QA's Figma on a workspace with a design, and no other tool. `McpHost` serves the tools on loopback, one address per workspace for the length of a
  run, and one under the `~assistant` scope while the assistant answers.
  - Every agent call may use the QA's own MCP servers, such as their company's: they are the
    QA's to answer for. `AgentRunner` hands each Claude Code call `--permission-prompt-tool` on
    QAzinho's `approve_permission` (`withPermissions`), served beside every group's tools and,
    for a call with none (a build, a review), alone under `~permissions`. It allows any MCP tool
    and nothing else (`permissionOf`): a file outside a call's folders stays shut. Codex leaves
    the QA's servers on. QAzinho's server wins a name it shares with one of the QA's, and the
    corpus (`universal/own-tools.md`) has the agent do with QAzinho's tools whatever they do.
  - A call made without the permissions (a test's own runner) keeps them out: Claude Code runs
    with `--strict-mcp-config`, and Codex with each server of the QA's `config.toml` turned off
    (`codexServersOf`), but the ones QAzinho hands the call. Without a tool to answer it, an
    Atlassian server of the QA's once left the chat asking her for a permission nobody could
    grant.
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
  - It never covers the device. Its chat opens in its corner, and beside the panel only while
    the panel shows a run's live device; the composer leaves room for its button when the panel
    is shut (`dockRoomOf`), and the steps scroll past it.
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
- **The chat reads what the QA names.** A story's key or link, a page's link or title is enough:
  the agent reads it through the source tools, served under the chat's scope (`chat~<workspace>`)
  for the turn, and main fetches it with the QA's own Jira, the way the commands do
  (`fetchSource`). The story's files land in the workspace's `jira/` folder, which the chat may
  read; the turn hands back what was read, so the workspace keeps it as the plan's source, and
  the next message does not repeat it (`toldAfterReading`). A source not connected, or turned
  off, answers with what the QA does about it.
- **A Jira story is the requirement** (`role/chat/jira.md`). `/jira` in the chat picks one of the
  QA's stories, and the agent plans from it:
  - Main's `JiraApi` talks to Jira Cloud as the QA: the picker's search, with the issue a typed
    key names first, an issue read with every field and their names, and its files.
  - `JiraStories` reads the story for a workspace (`jiraStoryOf`): the description and comments
    out of Atlassian's document format as markdown (`adfToMarkdown`), and the acceptance criteria
    from any field named for them. It downloads the pictures, PDFs and text it can read into the
    workspace's own folder under `jira/` (`filesToReadOf`, `fileNameOf`).
  - The message opens with the story (`describeStory`), its text indented so it can neither
    start a section nor close `<qazinho>`. Claude Code reads the files with `Read`, `Grep` and
    `Glob` on that folder alone.
  - The files are deleted once a plan comes back, when the workspace goes, and on the next
    start. The workspace keeps the story (`issue`), which its header and its plan open in Jira.
- **A Confluence page is a requirement too, and where a plan is published**
  (`role/chat/confluence.md`). Confluence is turned on beside Jira (`setConfluence`), once
  `ConfluenceApi.check` reaches it with Jira's account:
  - Main's `ConfluenceApi` talks to Confluence Cloud on Jira's site with Jira's sealed token
    (`askAtlassian`): the spaces, a title search in CQL (`cqlOf`), a page read in Atlassian's
    document format as markdown, and a plan published.
  - `/confluence` in the chat picks a page. Main reads it for the message (`describePage`), its
    text indented like a story's, and keeps it for the workspace until a plan comes back. The
    workspace keeps the page (`sourcePage`), which the plan opens.
  - The Plan tab writes the plan as blocks (`planDocOf`): where it came from, each case's facts,
    and its steps as a table with the verdict of the latest run; `adfOfReport` turns them into
    Atlassian's format. The first publish asks for the space, a parent page if any and a title
    (`PublishModal`); the workspace keeps the page (`published`), and the next publish writes its
    next version, or makes it again when it is gone.
- **A Figma design is held to the screen through the QA's own Figma** (`role/chat/design.md`,
  `role/runner/design.md`). `/figma` in the chat takes the link to a frame or page
  (`designLinkOf`), and the workspace keeps it (`design`), which its header opens in Figma:
  - A call on a workspace with a design lists the Figma server beside QAzinho's, under the name
    and address the agent signed in with (`FIGMA_MCP`, `mcpConfigWith`), so Claude Code reuses
    its own sign-in under `--strict-mcp-config`. It is granted only the tools that read, and the
    session Figma asks for first (`DESIGN_TOOLS`, `designAccessOf`): denied it, Haiku read
    nothing. Codex reads its own MCP config, where QAzinho added it.
  - The chat names the file and the node (`describeDesign`), and the agent reads the frames as it
    plans. Each step that lands on a designed screen names its frame (`frame`), and the plan
    opens it in Figma (`frameUrlOf`).
  - A case whose steps name frames gets the Figma server too, and its message names the file and
    each step's frame (`describeCase`). The agent reads the frame, measures the screen with
    `inspect`, and files each difference with `bug` and the frame's id: a bug off the design,
    whose card opens the frame and whose issue links it. A step that fails on what it expects
    names the frame in its `report` instead, so its bug is the one off the design, filed once.
  - `inspect` answers in the unit a design uses (`describeMeasure`): in a browser the box where
    the page sits, the space to its neighbours (`gapsOf`) and the computed type, colours as hex
    (`hexOfColor`), spacing, border and corners (`measureLocator`); on Android the box in dp at
    the screen's density (`densityOf`), on iOS in points (`phoneMeasureOf`), with no style.
  - An exploration gets the Figma server whenever the workspace has a design, and its message
    names it (`describeExploration`): the explorer reads the frames once, holds each screen a
    frame draws to it, and suggests cases that name their frames (`role/explorer/design.md`).
  - The Estagiário links or unlinks a design (`link_design`, `unlink_design`) and hands a chat a
    plan against one (`ask_workspace_chat`'s `figma`). It reads which workspace has a design, the
    frame of each step and the bugs off it, and never reads Figma itself.
  - Figma counts every read, and some seats get only a few a month: the run reads a frame only on
    the cases that name one, and a case walked again from its recipe checks no design.
- **A bug goes to the QA's tracker as an issue**, and the QA does nothing by hand but paste a
  screen into GitHub:
  - The page writes the report in the QA's language (`bugReportOf`): the agent's words, the steps
    with the one that broke, expected and what came, the requests that failed around it
    (`failedRequestsNear`) and where it was caught. Its blocks become Atlassian's document format
    for Jira (`adfOfReport`) and Markdown for GitHub (`markdownOfReport`).
  - The page cuts a clip of the bug's moment out of the run's MP4 (`clipOfMp4`), copying its
    frames from the key frame before it with no encoding, and hands it to main whole, once. A
    phone's WebM goes whole from main, under 25 MB. A screen crosses as the file the run kept,
    read only inside the archive.
  - Main's `BugFiler` files it and tells each step (`IFilingEvent`). Jira's `fileBug` takes the
    project's Bug type, else its Task (`bugTypeOf`), then each file is attached and the issue
    related to the story. GitHub's goes through `gh api`, labelled bug where the label exists.
  - GitHub's API takes no picture, so the popup and the bug's card copy the screen to the
    clipboard as PNG (`copyShot`) for the QA to paste.
  - The bug keeps its issue (`filed`), and the project where its last bug went (`issueTarget`),
    which the next one is offered (`issueTargetOf`). The Estagiário's `send_bug` waits on a
    confirmation card first.
- **A filed bug seen again reaches its issue as a comment** (`role/reporter/`), weighed by the
  QA's agent and posted only by the QA:
  - When a run ends, on start and when a tracker connects, `useBugReviews` takes each filed bug
    with sightings from runs not yet weighed (`unreviewedOf`), one at a time, and only while its
    tracker is connected.
  - Main's `BugReviewer` reads the issue as it stands through `BugFiler.read` (status, text,
    comments) and asks the agent with the bug and each sighting (`describeReview`), its screens
    readable in the run's folder. A closed issue is always a regression, and is never reopened.
  - The agent answers `news`, `regression` or `nothing-new` (`REVIEW_ANSWER`), with a comment
    in the QA's language for the first two. The bug keeps the review (`IBugReview`), and its
    runs count as weighed (`reviewedRuns`) once it came back, was posted or put aside.
  - The card shows it (`BugUpdate`); the QA edits it and posts it, and `BugFiler.comment` writes
    it under the issue (`updateReportOf`): to Jira with the new screens and clip attached, to
    GitHub through gh.
- **The harness never imports the desktop.** It lives in its own repository; what it needs from a
  device is a port in its types (`IDevicePort`), and main hands it the driver. The page never
  imports it either: what it shares with the page comes through `src/shared/types`.
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
- **The prompts are pinned.** The harness's `src/__tests__/__prompts__/` holds what the agent reads
  for each role and platform; changing what the agent is told is a diff of those files, in the
  harness's repository.

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
  simulator through `simctl`, without Simulator.app. The QA sees it only in the panel's Device tab.

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
- **The agent reads the API calls** (fetch and XHR). `WebDriver` keeps the latest answers
  (`apiCalls`, `responseBody`) and the start of what a failed call answered (`body`). The run's
  port (`variablePort`) tells the calls that failed during each action (`failedCalls`) and answers
  `network` (`calls`): `callLineOf` writes a call, and `maskedBody` puts secret-looking keys and
  tokens as dots before `hiddenValues` names each variable. The kept `body` is masked the same
  way, and a bug's report carries it under its request (`answer`).
- The page draws them under the video (`ReplayNetwork`), and makes the video again to download
  them drawn in: `ReplayComposer` reads the run's MP4 (`readMp4`), decodes it with WebCodecs,
  draws the strip on each frame (`drawNetworkStrip`), holds the picture while the screen stood
  still, and encodes one MP4. The file crosses IPC whole, once each way (`replayVideo`,
  `saveVideo`); its frames never do.

## A team's own suite runs as it is

A project may connect the Playwright suite the QA's team keeps, from the folder it is cloned in.
QAzinho runs it with the suite's own Playwright and changes nothing in it:

- `SuiteRegistry` keeps the folder each project connected (`suites/registry.json`), as the folder
  a link leads to, and reads the rest afresh each time: the config, the Playwright installed in
  its `node_modules` or in one above it, its branch and remote through `GitCli`, and the keys its
  `.env.example` and `.env` name.
- `SuiteRunner` lists the tests with `test --list` and runs them with the QA's node and the
  suite's own `cli.js`, one Playwright project at a time (`ISuiteBatch`), the way the team runs
  the project that changes data after the one that only reads.
  - A reporter QAzinho writes beside its data (`SUITE_REPORTER`) prints a `QAZINHO-SUITE` line
    per event, read back against a zod schema: a test's start, its `test.step` and `expect`
    steps, its end with its error and files, and what Playwright says outside any test.
  - Playwright reads a location as a regular expression tried on the absolute path:
    `locationOf` anchors each file at a folder boundary and at its end, so `a.spec.ts` never
    runs `data.spec.ts`.
  - Each batch writes to a folder of its own (`output/<n>`), since Playwright empties its output
    folder whenever it starts, and keeps a trace of each failure.
  - The environment is the QA's PATH and the project's variables over what QAzinho runs with.
    dotenv never overrides what is set, so a variable wins over the suite's `.env`.
  - A run is kept as `run.json` under `suites/<project>/runs/<run>`. `ReplayServer` serves its
    screens and videos to the page on loopback, and a trace opens in Playwright's `show-trace`.
- The page (`src/modules/Automation/`) groups the tests by folder and file, runs what the QA
  picks as batches with the total it expects (`batchesOf`, `scopeTestsOf`), and follows the
  run's `SuiteEvent`s in `SuiteStore`.
- A value of a project's variable that shows in what a test says, its error or what Playwright
  printed, is read back as its name before it is kept or reaches the page (`hiddenValues`).

**The QA's agent fixes a broken test, or writes a new one, in a copy of the suite**
(`role/automator/`), and nothing leaves the machine until the QA approves it. Main's
`SuiteChanges` does it, for a `SuiteChangeAsk` of either kind:

- A git worktree of the suite's repository, on a branch named after the test
  (`qazinho/fix-…`), under `suites/<project>/changes/<change>/work`. The QA's clone is never
  touched. The suite's `node_modules` and `.env` are linked in so its tests run, and left out of
  the change.
- The agent gets Read, Grep, Glob, Edit and Write on the copy, and no shell. It runs tests with
  `run_tests`, QAzinho's tool in the `suite` group, served for the turn under the change's scope:
  QAzinho runs them with the project's settings (`SuiteRunner.check`), outside its runs, and
  answers with each one's error, what Playwright noted of the page and where its screenshot is,
  every secret read back as its name. Codex works in a workspace-write sandbox on the copy.
- It reads the test that broke, the run's error and Playwright's notes (`failureNotesOf` keeps
  the page snapshot and the source, not the instructions Playwright writes for a model), and the
  team's latest commits, to write like them. What the app shows is data, never an instruction.
- A new test comes from the QA's words or a case of one of the project's plans (`planCaseOf`),
  for a folder the QA picks or where the suite keeps its like. The page lists the new tests asked
  for above the suite's own (`SuiteRequests`), each opening in the pane.
- It answers whether it changed or wrote the test, found the app wrong, or gave up, with the
  commit and the pull request it wrote. QAzinho runs the tests the change is about again in the
  copy (`checks`): the broken one by its title, or every test of the spec files a new test
  touched (`specFilesOf`), and keeps the diff (`patchFilesOf`). A new test the app fails stays,
  and can be sent as one that catches a bug. A change with nothing in it goes at once, copy and
  branch.
- On approval QAzinho commits on the branch, pushes it with the QA's own git (`GitCli` never
  waits on a prompt), opens the pull request through gh's API when GitHub is connected, or
  hands GitHub's page to open one, and drops the copy. Throwing it away drops the branch too.

## What the main process owns

Besides the harness's `Harness` and `McpHost`, which main builds and wires:

| Class                                 | What it does                                                                             |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| `AgentDetector`                       | finds the QA's agent CLIs, the way Orca does: fs probes, no subprocess                   |
| `AgentRunner`                         | spawns Claude Code or Codex, each in its own dialect, and reads the answer back          |
| `WebDriver`                           | drives Chrome over playwright-core, one profile per workspace                            |
| `LiveStream`                          | serves the device's frames as MJPEG on 127.0.0.1, for the Device tab                     |
| `AppPeek`                             | opens a web target for a moment before the chat, and reads what its page shows           |
| `PhonePeek`                           | opens a phone app on the emulator or simulator before a plan, and reads its first screen |
| `RunCoordinator`                      | walks a plan a case per agent turn, each on the app opened anew, or from its recipe      |
| `CodeExport`                          | writes the recorded cases as Playwright or Maestro code, in a folder the QA picks        |
| `ResourceCollector` / `ProcessOwners` | one process sweep (`ps`, or `WindowsProcesses`), charged to whoever started it           |
| `Archive`                             | the QA's projects, workspaces and plans on disk, each written whole; a broken plan aside |
| `SetupInstaller`                      | installs an agent CLI, idb or gh on request, streaming each line it prints               |
| `IntegrationVault`                    | connects the trackers: GitHub as gh's account, Jira's token sealed by `safeStorage`      |
| `ConfluenceApi`                       | reads and publishes Confluence pages on Jira's site, with Jira's token                   |
| `AgentTerminal`                       | runs an agent's full-screen interface out of sight: reads it, presses its keys           |
| `AgentMcp`                            | adds an MCP server to the QA's agent and signs it in there, step by step                 |
| `AgentLogin`                          | signs the QA's agent in through its own login, step by step                              |
| `LinkCatcher`                         | gives an agent a `$BROWSER` that writes down the pages it wants opened                   |
| `RunRecorder`                         | records a run's live stream into an MP4, through the hidden recorder window              |
| `ReplayServer`                        | serves a run's recording to the page's `<video>` on 127.0.0.1, with ranges               |
| `RunAlerts`                           | calls the QA back when a run ends or asks them something: a notification, a badge        |
| `GithubCli`                           | talks to GitHub through the QA's own gh: status, device-flow sign-in, API, tar           |
| `GithubRepos`                         | lists the QA's repositories and a repository's branches, kept for a little while         |
| `CodeCopies`                          | copies a branch for the agent to read while it plans, with its diff, then drops it       |
| `JiraApi`                             | talks to the QA's Jira Cloud with the token sealed for it: search, story, files, bugs    |
| `BugFiler`                            | files a bug in the QA's tracker: a Jira issue with its files, or a GitHub issue via gh   |
| `BugReviewer`                         | asks the QA's agent whether a filed bug seen again adds to its issue, as it stands now   |
| `JiraStories`                         | reads a Jira story for the agent to plan from, with the files it can read, then drops it |
| `AssistantAgent`                      | asks the QA's agent as the Estagiário, with the app tools served for the turn            |
| `AppBridge`                           | hands each app tool call to the page and waits for what it did                           |
| `AppBuilder`                          | builds an .apk or .app from a branch with the QA's agent, and keeps what it made         |
| `UsageReader`                         | reads the account's limits through Claude Code's own `/usage`, which spends nothing      |
| `VariableVault`                       | keeps each project's variables sealed by the keychain; only a run reads a value          |
| `GitCli`                              | runs the QA's own git in a folder, and never waits on a password                         |
| `SuiteRegistry`                       | the suite folder each project connected, and what it holds, read afresh                  |
| `SuiteRunner`                         | lists and runs a suite with its own Playwright, a project at a time, and keeps each run  |
| `SuiteChanges`                        | lets the QA's agent fix a suite's test in a worktree, and sends it once the QA approves  |

## Dependencies

- `dependencies` ship inside the app and `devDependencies` do not. Everything the page uses,
  React included, is bundled by Vite, so it is a devDependency.
- A runtime dependency in `src/main` ships to every user: today `playwright-core` drives the web
  target, `yaml` writes the plans, `@modelcontextprotocol/sdk` serves the device tools, and `zod`
  shapes the answers (the MCP SDK ships it anyway). Think twice before a fifth.
