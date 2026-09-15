# gocrash

A local-first desktop app where AI agents test your web and mobile apps from a test plan.

Go crash your app before your users do. You write the plan, the agent opens the app, walks the
flows and tells you what broke.

- **Web, Android and iOS.** A URL, an `.apk`, or a simulator `.app` build.
- **Your agent.** Claude Code, Codex, Gemini CLI or any other agent that speaks ACP.
- **Your machine.** Emulators, simulators and browsers run locally. Nothing goes to a gocrash
  server, because there is none.
- **Free and open source.** MIT, with no paid tier.

> **Status:** early scaffold. Nothing above works yet.

## Development

Requires Node 22.12 or newer.

```bash
npm install
npm run dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.

## License

[MIT](LICENSE) © Salve Software
