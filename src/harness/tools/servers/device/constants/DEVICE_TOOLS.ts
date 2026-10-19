import { z } from 'zod';
import { textNamed } from '@/harness/tools/servers/device/library/textNamed';

export const DEVICE_TOOLS = [
  {
    name: 'look',
    description:
      'Read what the device shows right now: the visible text and the controls a person could use.',
    input: z.object({}),
  },
  {
    name: 'goto',
    description:
      'Open a URL in the browser, or reopen the app from the launcher on a phone.',
    input: z.object({
      target: textNamed({
        message: '"goto" needs a target: say what the control or URL is.',
        description: 'The URL to open.',
      }),
    }),
  },
  {
    name: 'click',
    description:
      'Click or tap a control, named the way a person reads it: the button label, the link text, the row text. When several read alike, look numbers them: name the one you mean, like "Buy #2".',
    input: z.object({
      target: textNamed({
        message: '"click" needs a target: say what the control or URL is.',
        description: 'What the control says.',
      }),
      dialog: z
        .enum(['ok', 'cancel'], { error: '"dialog" is ok or cancel.' })
        .describe(
          'How to answer a browser dialog the click opens, such as "Are you sure?": ok unless the step says to cancel it.',
        )
        .optional(),
      promptText: z
        .string()
        .describe(
          'What to type into a browser prompt the click opens, such as a new title, before it is answered ok.',
        )
        .optional(),
    }),
  },
  {
    name: 'fill',
    description:
      'Type into a field, named by its label, placeholder or hint. When several read alike, look numbers them: name the one you mean, like "Email #2".',
    input: z.object({
      target: textNamed({
        message: '"fill" needs a target: say what the control or URL is.',
        description: 'The field label, placeholder or hint.',
      }),
      value: z
        .string({ error: '"fill" needs a value: say what to type.' })
        .describe('What to type.'),
    }),
  },
  {
    name: 'press',
    description:
      'Press a key: Enter, Tab, Escape on a browser; back, home, enter, tab, delete, escape or search on a phone.',
    input: z.object({
      target: textNamed({
        message: '"press" needs a target: say what the control or URL is.',
        description: 'The key.',
      }),
      dialog: z
        .enum(['ok', 'cancel'], { error: '"dialog" is ok or cancel.' })
        .describe(
          'How to answer a browser dialog the key opens, such as "Are you sure?": ok unless the step says to cancel it.',
        )
        .optional(),
      promptText: z
        .string()
        .describe(
          'What to type into a browser prompt the key opens, such as a new title, before it is answered ok.',
        )
        .optional(),
    }),
  },
  {
    name: 'wait',
    description: 'Wait for the device to settle, in milliseconds, before looking again.',
    input: z.object({
      value: textNamed({
        message: '"wait" needs a value: how many milliseconds.',
        description: 'Milliseconds, e.g. "1000".',
      }),
    }),
  },
  {
    name: 'report',
    description:
      'Report a step once you judged it, by its number. The answer says what to do next.',
    input: z.object({
      step: z
        .number({ error: '"report" needs "step": the number of the step you judged.' })
        .int({ error: '"report" needs "step": the number of the step you judged.' })
        .min(1, { error: '"report" needs "step": the number of the step you judged.' })
        .describe('The number of the step you judged.'),
      verdict: z.enum(['passed', 'failed', 'blocked'], {
        error: '"report" needs "verdict": passed, failed or blocked.',
      }),
      why: textNamed({
        message: '"report" needs "why": what the verdict rests on.',
        description:
          'What the verdict rests on: what you saw, held against what the QA expected. One short sentence when the step passed.',
      }),
      got: z
        .string({ error: '"report" needs "got": what the device actually showed.' })
        .trim()
        .describe('What the device actually showed: a few words when the step passed.'),
      title: z
        .string()
        .trim()
        .describe('When it failed: the line a developer would know the bug by.')
        .optional(),
      severity: z
        .enum(['high', 'medium', 'low'], {
          error: '"severity" is high, medium or low.',
        })
        .optional(),
      note: z
        .string()
        .trim()
        .describe('When you worked around something: one sentence for the QA.')
        .optional(),
    }),
  },
  {
    name: 'bug',
    description:
      'File a bug you saw that the step does not ask about, such as a wrong price, a broken link or two texts that disagree. The step keeps its own verdict: carry on with it.',
    input: z.object({
      title: textNamed({
        message: '"bug" needs "title": the line a developer would know the bug by.',
        description: 'The line a developer would know the bug by.',
      }),
      severity: z.enum(['high', 'medium', 'low'], {
        error: '"severity" is high, medium or low.',
      }),
      expected: textNamed({
        message: '"bug" needs "expected": what the app should show.',
        description: 'What the app should show.',
      }),
      got: textNamed({
        message: '"bug" needs "got": what the device actually showed.',
        description: 'What the device actually showed.',
      }),
    }),
  },
] as const;
