# QAzinho

A local-first desktop QA assistant. A QA professional plans tests, runs them on web and mobile
apps, and keeps their test work organised, with their own AI agent alongside: the agent drafts the
plan with them, walks the flows on a real device and reports what it saw against what the QA
expected. The QA stays in charge; the agent is the assistant.

| Target  | Input                                   | Driven by                                         | Verified   |
| ------- | --------------------------------------- | ------------------------------------------------- | ---------- |
| web     | the environment's URL                   | Playwright over the QA's own Chrome               | end to end |
| Android | an `.apk`                               | the QA's own AVD, through `adb` and `uiautomator` | end to end |
| iOS     | a simulator `.app` build, not an `.ipa` | `simctl` boots and shoots; `idb` reads and taps   | end to end |

QAzinho finds the SDK, the emulator and idb where they already are, and names what is missing
where the QA reads it. **It installs only what is light, and only when the QA asks**: the agent
CLIs over npm, and idb as Homebrew's companion plus its Python client in a virtualenv of its own
(simctl has no command that touches the screen).
The Android SDK and Xcode are too big: the first-run setup links to them and checks again.

Built for technical QA teams, and for QA moving from manual to technical. A project is an
environment with one or more targets. Workspaces hold a test plan, and several run in parallel.

**It looks like a desk with stickers on it** (`rules/sticker-design.md`): the work is printed on
a Night or Paper surface, and the Estagiário, the wordmark, the main buttons, badges, cards and
popups are die-cut stickers that slap on and peel off. That design is the face of the app; every
screen follows it.

## The rules that are not up for negotiation

1. **Everything runs on the user's machine.** Emulators, simulators, browsers and runs. The free
   app never needs a QAzinho backend; only Pro's team hosting uses one.
2. **The agent is the user's.** Claude Code or Codex for now, driven through their own CLIs; more
   agents come later, one at a time, each checked against the real CLI before it is offered.
   QAzinho builds the QA harness around it and never holds a provider key or a login of its own.
   When the agent is signed out, QAzinho starts the agent's own sign-in (`claude auth login`,
   `codex login`): the page opens in the QA's browser, and the agent keeps what it gets.
3. **A Salve Software product, closed source, in two plans.** Free is the whole desktop app, with
   no account and no artificial limit: download it and use it. Pro is a paid web platform for a
   company: an account and an org, where the QA syncs the projects on their machine to share
   projects, plans and runs. The desktop app never needs Pro and nothing local is shaped around
   it. Today the work is the desktop app; the platform comes later (`ROADMAP.md`).
4. **The page is a web page and nothing more.** No Node, no Electron, no filesystem. It asks the
   main process through `window.qazinho`, whose contract lives in `src/shared/types/`.
5. **Nothing in the interface is a mock.** Every number, screenshot and verdict on screen came
   back from the machine. When something is not built yet, it says so where a QA can read it.

## State

**The web target works end to end.** A QA makes a project and a workspace, talks to their own
agent, gets a plan, runs it, and watches real Chrome be driven step by step. The plan comes out
of a conversation: the agent looks at the app, asks one round of questions in the chat, and
confirms what it will write before it writes it. In the run, the agent reads the
page, acts, the run screenshots it, and the agent judges what it sees against what the QA
expected. A failed step becomes a bug with its evidence. Everything is kept on disk, one folder
per workspace, with the plan beside it in YAML.

`npm run test:smoke` proves it: it drives the real browser with the real agent.

**Android works the same way**, proven by `tests/smoke/android.test.ts`: it installs a visit
counter built from source on the QA's own AVD, reads the screen out of `uiautomator`, taps what
the agent named, and judges what it sees.

**iOS works the same way**, proven by `tests/smoke/ios.test.ts`: a visit counter built from
source for the simulator (`tests/smoke/fixtures/`), read and tapped through idb, and a plan walked
and judged by the QA's own agent. Every case starts on the app opened anew: Android clears its
data, iOS reinstalls it, the web clears the browser (`device-fresh.test.ts`, `fresh.test.ts`).

**Every run is recorded and plays back with its timeline.** A browser is recorded from its live
stream, a simulator by `simctl`, an emulator by its console. The run's video opens in a theater:
a chapter per case in its verdict's colour, a pin per bug, a still of any moment under the
cursor, and the steps beside it, kept in step. Each case offers its take in Runs, and each bug
its moment in Bugs. `tests/smoke/record.test.ts` proves the browser's recording.

**A run that ends calls the QA back** while they are away: a notification with its sound and a
count on the app's icon, unless they asked to hear only inside the app, where a notice says it.

**A first run walks the machine** (`Onboarding`): language, the agent, the device tools, the
trackers. GitHub and Jira connect for real. Jira's token is checked with Jira and sealed by the
OS keychain.

**GitHub goes through the QA's own GitHub CLI**, and QAzinho keeps no token. Connecting runs gh's
device flow out of sight, or takes a gh already signed in, and installs gh when it is missing. A
project then picks its repositories, and `/code` in the chat plans from one of their branches:
the base branch for the whole app, any other for what it changed. The agent reads a copy of the
branch, read only, and the copy is gone once the plan is written; the plan keeps the commit it
came from. A real Claude Code has planned from a public branch this way; through Codex it has not
been tried. `tests/smoke/github.test.ts` drives a fake gh.

**The Estagiário answers from the corner.** A sticker in the bottom-right corner opens a little
chat where the QA's own agent talks about any project, workspace, run or bug. It also does what
the QA could do by hand: open a screen, create or change a project, link a repository, create,
rename, run or stop a workspace, change the settings, connect a tracker, and delete or
disconnect once the QA confirms on a card. `tests/smoke/assistant.test.ts` drives it with a fake
agent over the real MCP server; no real agent has driven it yet.

**The app builds from its own code.** A project that names its repositories builds its .apk or
simulator .app from any branch, from the project's card or by asking the Estagiário. The QA's own
agent builds it in a copy of the branch: React Native, Expo, Flutter or a native app, a build that
runs alone on the emulator or simulator. What it made is checked, kept, and becomes the project's
target. `tests/smoke/build.test.ts` drives it with a fake gh and a fake agent; no real agent has
built a real app yet.

**Codex is half verified.** QAzinho drives it through `codex exec --json` and its own MCP server,
checked against a fake Codex built from the real one's events. The chat has answered through a
real signed-in Codex (CLI 0.163.0), in the strict schema; a run, with the device tools over MCP,
has not. That is ours to know, not the QA's: no caveat about QAzinho's own testing goes in the
interface.

**Still to build for 0.1:** the agent cannot ask the QA a question mid-run, and a connected
tracker does not receive a bug yet.

## Mandatory rules

@rules/architecture.md
@rules/code-structure.md
@rules/components.md
@rules/sticker-design.md
@rules/design-tokens.md
@rules/animation.md
@rules/i18n.md
@rules/comments.md
@rules/testing.md
@rules/tooling.md
