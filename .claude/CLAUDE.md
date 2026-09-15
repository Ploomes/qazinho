# gocrash

A local-first desktop app where AI agents test web and mobile apps from a test plan. The QA writes
the plan and orchestrates; the agent opens the app, walks the flows and reports what broke. The
name is the pitch: go crash your app before your users do.

| Target  | Input                                   | Driven by (planned)                                    |
| ------- | --------------------------------------- | ------------------------------------------------------ |
| web     | the environment's URL                   | Playwright                                             |
| Android | an `.apk`                               | the Android Emulator, headless, streamed in the window |
| iOS     | a simulator `.app` build, not an `.ipa` | the iOS Simulator, macOS only                          |

Projects hold targets. Workspaces hold a test plan, and several run in parallel.

## The rules that are not up for negotiation

1. **Everything runs on the user's machine.** Emulators, simulators, browsers and runs. There is
   no gocrash backend, and no feature may assume one.
2. **The agent is the user's.** Claude Code, Codex, Gemini CLI or any other, spoken to over ACP
   (Agent Client Protocol). gocrash never offers a login to a model provider and never holds a
   provider key of its own.
3. **Free and open source, with no paid tier.** No feature is shaped around a limit.
4. **The renderer is a web page and nothing more.** No Node, no Electron, no filesystem. It asks
   the main process through `window.gocrash`, whose contract lives in `src/shared/types/`.

## State

Scaffold only: an Electron window with a sandboxed preload, a navigation guard and the tooling.
The layout is being designed separately and has not landed.

**Planned, in order:**

1. projects and workspaces, and the chat with the agent over ACP;
2. the web target through Playwright, shown inside the window;
3. the Android target: emulator frames over a local WebSocket or WebRTC, never over IPC;
4. test plans, and a run report with a screenshot and a verdict per step;
5. the iOS target, last, because the Simulator has no public API to embed it.

## Mandatory rules

@rules/architecture.md
@rules/code-structure.md
@rules/comments.md
@rules/testing.md
@rules/tooling.md
