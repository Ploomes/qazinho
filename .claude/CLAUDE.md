# gocrash

A local-first desktop app where AI agents test web and mobile apps from a test plan. The QA writes
the plan and orchestrates; the agent opens the app, walks the flows and reports what broke. The
name is the pitch: go crash your app before your users do.

| Target  | Input                                   | Driven by                                              |
| ------- | --------------------------------------- | ------------------------------------------------------ |
| web     | the environment's URL                   | **Playwright over the QA's own Chrome — this works**   |
| Android | an `.apk`                               | the Android Emulator, headless, streamed in the window |
| iOS     | a simulator `.app` build, not an `.ipa` | the iOS Simulator, macOS only                          |

A run on a target gocrash cannot drive yet says so in the chat. It never pretends.

Built for technical QA teams, and for QA moving from manual to technical. A project is an
environment with one or more targets. Workspaces hold a test plan, and several run in parallel.

## The rules that are not up for negotiation

1. **Everything runs on the user's machine.** Emulators, simulators, browsers and runs. The free
   app never needs a gocrash backend; only Pro's team hosting uses one.
2. **The agent is the user's.** Claude Code, Codex, Gemini CLI or any other, spoken to over ACP
   (Agent Client Protocol). gocrash builds the QA harness around it and never offers a login to a
   model provider or holds a provider key of its own.
3. **Open core.** The app is MIT and free, with no artificial limit for one user. Pro adds team
   hosting, and nothing local is shaped around it.
4. **The page is a web page and nothing more.** No Node, no Electron, no filesystem. It asks the
   main process through `window.gocrash`, whose contract lives in `src/types/`.
5. **Nothing in the interface is a mock.** Every number, screenshot and verdict on screen came
   back from the machine. When something is not built yet, it says so where a QA can read it.

## State

**The web target works end to end.** A QA makes a project and a workspace, talks to their own
agent, gets a plan, runs it, and watches real Chrome be driven step by step: the agent reads the
page, acts, the run screenshots it, and the agent judges what it sees against what the QA
expected. A failed step becomes a bug with its evidence. Everything is kept on disk, one folder
per workspace, with the plan beside it in YAML.

`npm run test:smoke` proves it: it drives the real browser with the real agent.

**Still to build for 0.1:** the Android target (the emulator, `adb`, installing an `.apk`) and
the iOS one. The agent cannot ask the QA a question mid-run yet, and no issue tracker is
connected.

## Mandatory rules

@rules/architecture.md
@rules/code-structure.md
@rules/components.md
@rules/design-tokens.md
@rules/animation.md
@rules/i18n.md
@rules/comments.md
@rules/testing.md
@rules/tooling.md
