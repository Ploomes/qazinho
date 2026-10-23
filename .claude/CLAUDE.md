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

**It is calm and flat to work in all day** (`rules/sticker-design.md`): the work sits on a Night
or Paper surface, cards and popups are raised only by a 1px line and, when they float, a soft
shadow, and nothing tilts or slaps on. The brand lives in a few touches: the lime accent, the
Estagiário drawn flat, the wordmark and Bricolage on titles. Every screen follows it.

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
expected. A failed step becomes a bug with its evidence. A bug that comes back is not filed
twice: each run's agents hear the bugs open and name one seen again, a plan step that fails again
lands on its bug, and the Bugs tab counts the runs that saw it, with each screen; a fake agent
walking a plan twice left one bug per problem, each seen in two runs. Everything is kept on disk,
one folder per workspace, with the plan beside it in YAML.

`npm run test:smoke` proves it: it drives the real browser with the real agent.

**Android works the same way**, proven by `tests/smoke/android.test.ts`: it installs a visit
counter built from source on the QA's own AVD, reads the screen out of `uiautomator`, taps what
the agent named, and judges what it sees.

**iOS works the same way**, proven by `tests/smoke/ios.test.ts`: a visit counter built from
source for the simulator (`tests/smoke/fixtures/`), read and tapped through idb, and a plan walked
and judged by the QA's own agent. Every case starts on the app opened anew: Android clears its
data, iOS reinstalls it, the web clears the browser (`device-fresh.test.ts`, `fresh.test.ts`).
A step that closes the app and opens it again does it for real with `reopen`, its data kept:
Android stops the app, iOS terminates it, the web opens its address in a new tab. The runner
also scrolls until words show, holds a finger down and drags one thing onto another, and on the
web it hovers and uploads a sample file QAzinho made. On a phone it scrolls before it calls
something missing. The browser and both fixture apps prove the scroll and the long press
(`tools.test.ts`, `device-fresh.test.ts`); a drag on a phone has not met a real app. Before a plan
on a phone, the chat opens the app on the emulator or simulator and reads its first screen. An
iOS app that does not adopt UIScene does not launch on iOS 27, and QAzinho says it closed at once.

**A case that passed is walked again without the agent.** Each step's actions are recorded with
the words on screen that proved it, and the next run repeats them on the device and checks the
words: seconds and no cost, against tens of seconds and a few cents with the agent. When the
app changed and a word does not show, the agent walks the case again and records it anew
("healed"). The recorded cases export as a Playwright test file or Maestro flows, gestures
included. A real Claude
Code has recorded a web and an Android plan this way, both walked again with no agent, and the
exported Playwright file passed in Chrome; the Maestro flows have not run in Maestro yet.
`tests/smoke/replay.test.ts` proves it with a fake agent.

**An exploration needs no plan.** From the empty chat, the workspace's Explore button or the
Estagiário, the QA's agent goes through the app on its own for ten minutes: it notes each screen
it reaches, files what is broken as bugs, and finishes with a suggested plan that waits on a
card in the chat until the QA takes it into the plan. It is a run of its own, recorded like one,
its screens the steps of one case; a finish with more than a third of the time left is sent back
once. A real Claude Code (Haiku) explored a booking app with six planted bugs and found four in
about a minute, logging in with the project's variables; `tests/smoke/explore.test.ts` drives a
fake agent on real Chrome, and through the app only a fake explorer has gone yet.

**A project keeps its logins and secrets as variables**: a name, what it holds, and a value
sealed by the OS keychain in main, which never reaches the page or an agent again. The QA adds
them in the project's window, or types them in a window the chat or the Estagiário opens: when a
plan needs an account, the chat's agent offers the variables that fit and an option that creates
what is missing. A step names one as `${NAME}`. The run types its value, reads any value the
screen shows back as its name, and keeps the name in recipes and exported code. On Linux with no
secret store QAzinho keeps none, and Android types every character but a double quote, which it
refuses. `tests/smoke/variables.test.ts` proves the run on real Chrome with a fake agent, and a
real Claude Code (Haiku) planned a login asking for the account through the window, then signed
in with the sealed values: 8 steps of 8, with no value in the plan or the report.

**Every run is recorded and plays back with its timeline.** A browser is recorded from its live
stream, a simulator by `simctl`, an emulator by its console. The run's video opens in a theater:
a chapter per case in its verdict's colour, a pin per bug, a still of any moment under the
cursor, and the steps beside it, kept in step. Each case offers its take in Runs, and each bug
its moment in Bugs. `tests/smoke/record.test.ts` proves the browser's recording.

**A web run keeps its network beside its video.** Chrome notes each request the app makes, with
its status, time and size, and the run keeps them with a variable's value written as its name and
a token as dots. In the theater, the Network switch folds a strip open under the video: each
request lands as the video reaches it, waits for its answer and jumps the video there on a click,
and a failed one leaves a mark on the timeline. With the strip shown, Download makes the video
again with the strip drawn under it. `tests/smoke/network.test.ts` proves the capture on real
Chrome, and `strip.test.ts` the strip and the download in the built app. A phone run keeps no
network yet.

**A team's own Playwright suite runs in QAzinho.** A project connects the folder where the
team keeps its suite cloned, and QAzinho reads it there and changes nothing in it: the tests by
folder and file, listed and run by the suite's own Playwright on the QA's node, one Playwright
project at a time, with the project's variables reaching the tests from the environment, never
written to a file. The suite's screen runs everything, the failed, a folder, a file or one test,
follows each step as it goes, and keeps each run with each test's error, the screen it left and
its trace, which opens in Playwright's own viewer. `tests/smoke/suite.test.ts` lists and runs a
fixture suite on real Chrome.

**The QA's agent fixes a broken test of the team's suite**, on a branch of its own in a git
worktree QAzinho keeps, never in the QA's clone. It reads and edits the copy with no shell, and
runs the tests through QAzinho's own tool, which knows the project's secrets and hands the agent
their names. When the test is right and the app is wrong, it changes nothing and says so. QAzinho
runs the test again in the copy and shows the diff; only once the QA approves does it commit,
push with the QA's own git and open the pull request through gh. A real Claude Code (Haiku) fixed
a renamed link in 34 seconds and told a planted search bug apart from a broken test;
`tests/smoke/fix.test.ts` drives a fake agent over the real tool on real Chrome.

**The QA's agent also writes a new test** the same way, from the QA's words or a case of one of
the project's plans, in the folder the QA picks or where the suite keeps its like, with the
team's fixtures, IDs and tags. QAzinho runs every test of the spec files it touched, and a new
test the app fails stays, as one that catches a bug. A real Claude Code (Haiku) wrote one from a
sentence in about a minute and one from a plan case in a minute and a half, each passing in the
copy; `tests/smoke/write.test.ts` drives a fake agent on real Chrome.

**The agent asks the QA mid-run.** A case's agent, or the explorer, that cannot go on without
the QA calls `ask_qa`: a code texted to their phone, a choice the case leaves open, a screen only
they can judge. The run holds and the chat shows the question on a card, with the answers it
offers; the sidebar, the header and the device panel say the run waits on the QA. A secret is
typed in a hidden field and goes as a variable: the agent types `${NAME}` and never sees it, and
the project keeps it when the QA says so. With no answer in 15 minutes the agent goes on without
one, and Stop ends the wait. The answers stay in the run's section and in Runs, on the step they
were asked at. `tests/smoke/ask.test.ts` proves it with a fake agent on real Chrome. A real Claude
Code (Haiku) asked in Portuguese which plan to pick and, as a secret, for the code texted to the
phone, then passed the case, the code in no event; it held one call for 16 minutes. Through Codex
it has not been tried.

**A run that ends calls the QA back** while they are away: a notification with its sound and a
count on the app's icon, unless they asked to hear only inside the app, where a notice says it.
A question from a run calls them back the same way.

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

**A Figma design is held to the screen.** `/figma` in the chat takes the link to a frame or
page, and the QA's own agent reads it through the Figma MCP it signed in to in Settings: the
sizes, spacing, colours, type, texts, states and the designers' annotations. It plans with the
QA, and each step that lands on a designed screen names its frame, which the plan opens in Figma.
A run hands those cases the same Figma: the agent reads the frame, measures the screen with
`inspect` (CSS px, type and colours on the web; dp on Android, points on iOS) and files each
difference as a bug off the design, whose card and issue link the frame. An exploration does
the same on the screens the design draws, and suggests cases that name their frames. The
Estagiário links or unlinks a design, hands a workspace's chat a plan against one, and reads
which steps and bugs belong to a frame. A strict MCP config
under the same name and address reuses Claude Code's sign-in, checked against the real CLI;
`tests/smoke/design.test.ts` drives a fake agent on real Chrome, and `tools.test.ts` measures a
control there. A real Claude Code (Haiku) planned from a real frame, captured into Figma from a
checkout page, and walked a copy with four planted differences: it filed the title, the total's
size and the button's colour and corners, each on its frame, for about a cent. Figma counts every
read, a few a month on some seats, so a case walked again from its recipe checks no design.

**A Jira story becomes the plan's requirement.** With Jira connected, `/jira` in the chat picks a
story: the ones the QA opened last, or one found by its key or its words. QAzinho reads it whole
with the QA's own token: the description, the acceptance criteria from whatever field the team
keeps them in, the comments, the linked issues and subtasks, and the pictures, PDFs and text
attached, downloaded for the agent to read. The agent plans from it: each criterion gets a case
that names it, what the story leaves open is a question, and the story's text is never an
instruction. The files are gone once the plan is written; the workspace keeps the story, which
its header and its plan open in Jira. The Estagiário hands a workspace's chat a story by its key.
`tests/smoke/jira.test.ts` reads one from a fake Jira site, and a real Claude Code (Haiku)
planned from one with a screen attached: it read the screen, asked about what the story left
open, and named the criterion each case covers. A real Jira site has not been tried.

**A bug goes to the QA's tracker as an issue.** An open bug sends itself from its card, or the
Estagiário sends it once the QA confirms on a card. To Jira it goes as a Bug of the project the QA
picks: its steps with the one that broke, what was expected and what came, the requests that
failed around it and where it was caught, with its screens and a clip of the moment cut from the
run's video attached (a phone's whole recording, when it is under 25 MB), and a link to the story
the plan came from. To GitHub it goes through the QA's own gh, as a Markdown issue labelled bug;
GitHub takes pictures only on its own page, so QAzinho copies the screen for the QA to paste. The
bug keeps its issue's key, and the project keeps where its last bug went.
`tests/smoke/filing.test.ts` files bugs in a fake Jira and through a fake gh, and the built app
sent one to each; a real Jira site or repository has not been tried.

**A bug seen again after it was filed reaches its issue as a comment**, never by rewriting it.
When a run ends, the QA's agent reads the issue as it stands, its status and comments, beside
the runs that caught the bug again, and says whether they add something the issue lacks, whether
the bug came back after the issue was closed, or nothing. What it suggests waits on the bug's
card, where the QA edits it and posts it with one click, or puts it aside; Jira gets the new
screens and clip with it. A closed issue is called a regression and never reopened.
`tests/smoke/review.test.ts` weighs one through a fake agent and a fake Jira, and the built app
posted one; a real agent has not weighed one yet.

**The Estagiário answers from the corner.** A sticker in the bottom-right corner opens a little
chat where the QA's own agent talks about any project, workspace, run or bug. It also does what
the QA could do by hand: open a screen, create or change a project, link a repository, create,
rename, run or stop a workspace, change the settings, connect a tracker, and delete, disconnect or
send a bug to a tracker once the QA confirms on a card. A plan it hands to the workspace's own
chat, which writes it with the QA, and it helps answer that chat's questions. Its chat outlives a
restart. `tests/smoke/assistant.test.ts` drives it with a fake agent over the real MCP server,
and a real Claude Code (Haiku) has driven it through a QA's day in both languages; through Codex
it has not.

**The app builds from its own code.** A project that names its repositories builds its .apk or
simulator .app from any branch, from the project's card or by asking the Estagiário. The QA's own
agent builds it in a copy of the branch: React Native, Expo, Flutter or a native app, a build that
runs alone on the emulator or simulator. What it made is checked, kept, and becomes the project's
target. `tests/smoke/build.test.ts` drives it with a fake gh and a fake agent. A real Claude Code
(Haiku), asked through the Estagiário, has built a native Android app with Gradle from a branch
a fake gh handed over; React Native, Expo, Flutter and iOS have not been built by a real agent
yet. QAzinho's calls run with the QA's own Claude Code hooks off: a hook that rewrites commands,
such as rtk's, made every Gradle command fail the build's permissions.

**Codex is half verified.** QAzinho drives it through `codex exec --json` and its own MCP server,
checked against a fake Codex built from the real one's events. The chat has answered through a
real signed-in Codex (CLI 0.163.0), in the strict schema; a run, with the device tools over MCP,
has not. That is ours to know, not the QA's: no caveat about QAzinho's own testing goes in the
interface.

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
