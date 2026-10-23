# Platforms

QAzinho runs on **Windows, Linux and macOS**, and every change keeps it running on all three. A QA
on Windows gets the same app as one on a Mac. Only what the OS itself forbids differs: iOS
simulators exist only on a Mac, so the iOS target and idb live there alone.

## Starting a command

- **Every child process starts through `spawnCommand` or `execCommand`** (`src/main/library`),
  never through `spawn` or `execFile` directly. On Windows they do three things:
  - An npm `.cmd` shim runs as the script or `.exe` it points at (`launchOf`). Node refuses to
    start a `.cmd` without a shell, and cmd.exe mangles a JSON argument.
  - No console window flashes up (`windowsHide`).
  - The child gets one PATH (`envWithOnePath`). Windows names its own `Path`, and a `PATH` set
    beside it must be the one read.
- **A command is found with `findOnPath` over `machineDirectories()`**, the one place main looks
  commands up:
  - PATH splits by the platform's own separator.
  - On Windows a command is found by its `.exe` before its `.cmd`, and never as the
    extensionless sh script npm writes beside them.
  - `searchDirectories` adds where each platform installs things: Homebrew and `~/.local/bin`;
    `/snap/bin`; `%APPDATA%\npm`, `Program Files\nodejs`, `Git\cmd`, `GitHub CLI` and winget's
    links.
- **A process tree ends through `killTree`.** On a Mac or Linux it signals the process group. On
  Windows, which has no signals, `taskkill /T /F` ends the tree, so a gentle `SIGINT` is a hard
  stop there.
- **Nothing that runs everywhere names a POSIX tool**: no `/bin/sh`, `/usr/bin/…`, `ps`, `which`
  or `brew` by itself. A tool one platform lacks is gated by `process.platform`, with what the
  others do instead:

  | Need                         | Mac               | Linux                                      | Windows                                       |
  | ---------------------------- | ----------------- | ------------------------------------------ | --------------------------------------------- |
  | every process, for Resources | `ps`              | `ps`                                       | one PowerShell kept open (`WindowsProcesses`) |
  | install gh                   | Homebrew          | Homebrew                                   | winget                                        |
  | a terminal the QA sees       | a `.command` file | the desktop's terminal (`linuxTerminalOf`) | a `.cmd` file                                 |
  | the hidden terminal (`/mcp`) | `expect`          | `expect`, when installed                   | none: the visible terminal                    |
  | catch the agent's browser    | a sh `$BROWSER`   | a sh `$BROWSER`                            | none: the agent opens its page                |
  | Android Studio's JDK         | inside the .app   | `/opt`, `~`, snap                          | `Program Files\Android`                       |

## Paths

- Build a path with `path.join`. A path that came from git, Playwright or a tool compares with
  either slash (`[\\/]`), and a path the page keeps (a test's file) is written with `/`.
- A symlink needs an administrator on Windows: a folder links as a junction, a file is copied.
- An SDK binary (`adb`, `emulator`, `aapt2`) is started by its path with no extension, which
  Windows completes with `.exe`. A check that the file exists must not forget the extension.

## Window and keyboard

- The Mac keeps its traffic lights (`hiddenInset`). Windows and Linux get their own controls over
  the titlebar (`titleBarOverlay`), painted from the theme on screen (`paintWindowControls`), and
  the titlebar leaves room for them (`titlebar--overlay`).
- A shortcut is kept with ⌘ and ⌥, and Ctrl presses what ⌘ does. The page shows it the way the
  keyboard names it (`comboLabelOf`): Ctrl and Alt off the Mac.
- Windows shows notifications under the app's own name (`setAppUserModelId`).
- One QAzinho runs per data folder (`requestSingleInstanceLock`). The Dock keeps a Mac to one,
  but Windows and Linux start a second app on each launch; it leaves and brings the open window
  forward.

## Proving it

- A library that differs by platform takes `platform` as a parameter, and its test covers
  `win32`, `linux` and `darwin`. Windows' paths are tested as strings: `C:\Users\…`.
- CI runs on Linux alone, and no Windows machine has walked the app yet. Until one does, a
  Windows path is proven by its unit test, and a change that touches processes or paths says
  which platforms it reasoned about.
