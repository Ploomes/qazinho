# gocrash

A local-first desktop app where AI agents test web and mobile apps from a test plan. The QA writes
the plan and orchestrates; the agent opens the app, walks the flows and reports what broke. The
name is the pitch: go crash your app before your users do.

| Target  | Input                                   | Driven by (planned)                                    |
| ------- | --------------------------------------- | ------------------------------------------------------ |
| web     | the environment's URL                   | Playwright                                             |
| Android | an `.apk`                               | the Android Emulator, headless, streamed in the window |
| iOS     | a simulator `.app` build, not an `.ipa` | the iOS Simulator, macOS only                          |

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
4. **The renderer is a web page and nothing more.** No Node, no Electron, no filesystem. It asks
   the main process through `window.gocrash`, whose contract lives in `src/shared/types/`.

## State

Scaffold only: an Electron window with a sandboxed preload, a navigation guard and the tooling.
The layout is being designed separately and has not landed.

**Planned for 0.1:** projects, workspaces, test plans and runs on web, Android and iOS.

## Mandatory rules

@rules/architecture.md
@rules/code-structure.md
@rules/components.md
@rules/design-tokens.md
@rules/comments.md
@rules/testing.md
@rules/tooling.md
