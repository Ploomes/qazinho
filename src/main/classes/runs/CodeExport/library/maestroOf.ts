import type { ICaseRecipe } from '@/main/classes/runs/RunCoordinator/types';
import type { IFlatStep, IStepAction } from '@/shared/types';
import { ordinalOf, withoutRole } from '@/main/library';

const KEYS: Record<string, string> = {
  back: 'Back',
  home: 'Home',
  enter: 'Enter',
  tab: 'Tab',
  delete: 'Backspace',
  escape: 'Back',
  search: 'Search',
};

function yamlText(text: string): string {
  return JSON.stringify(text);
}

function pattern(text: string): string {
  return text.replace(/[\\^$.|?*+()[\]{}]/g, '\\$&');
}

function tapOf(target: string): string {
  const { name, nth } = ordinalOf(withoutRole(target) ?? target);

  return nth === 0
    ? `- tapOn: ${yamlText(pattern(name))}`
    : `- tapOn:\n    text: ${yamlText(pattern(name))}\n    index: ${String(nth)}`;
}

function linesOf(action: IStepAction): string[] {
  switch (action.kind) {
    case 'goto':
      return ['- launchApp'];
    case 'reopen':
      return ['- stopApp', '- launchApp'];
    case 'click':
      return [tapOf(action.target)];
    case 'fill':
      return [tapOf(action.target), `- inputText: ${yamlText(action.value)}`];
    case 'press':
      return [`- pressKey: ${KEYS[action.target.toLowerCase()] ?? 'Enter'}`];
    case 'wait':
      return ['- waitForAnimationToEnd'];
  }
}

/** A Maestro flow for one case a phone app's runs recorded: the app opened anew, each step done, and its proof asserted on screen. */
export function maestroOf(props: {
  appId: string;
  steps: IFlatStep[];
  recipe: ICaseRecipe;
}): string {
  const [first] = props.steps;
  const body = props.steps.flatMap((step) => {
    const kept = props.recipe.steps.find(({ number }) => number === step.numberInCase);

    return [
      `# ${String(step.numberInCase)}. ${step.action} → ${step.expected}`,
      ...(kept?.actions ?? []).flatMap(linesOf),
      `- assertVisible: ${yamlText(`.*${pattern(kept?.proof ?? '')}.*`)}`,
    ];
  });

  return [
    `appId: ${props.appId}`,
    `name: ${yamlText(`${first?.caseId ?? props.recipe.caseId} · ${first?.caseTitle ?? ''}`)}`,
    '---',
    '- launchApp:',
    '    clearState: true',
    ...body,
    '',
  ].join('\n');
}
