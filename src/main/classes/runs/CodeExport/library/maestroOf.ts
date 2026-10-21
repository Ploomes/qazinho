import type { ICaseRecipe } from '@/main/classes/runs/RunCoordinator/types';
import type { IFlatStep, IStepAction } from '@/shared/types';
import { ordinalOf, withoutRole } from '@/main/library';

const SWIPES: Record<string, string> = {
  down: '- scroll',
  up: '- swipe:\n    direction: DOWN',
  right: '- swipe:\n    direction: LEFT',
  left: '- swipe:\n    direction: RIGHT',
};

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

function onOf(props: { command: string; target: string }): string {
  const { name, nth } = ordinalOf(withoutRole(props.target) ?? props.target);

  return nth === 0
    ? `- ${props.command}: ${yamlText(pattern(name))}`
    : `- ${props.command}:\n    text: ${yamlText(pattern(name))}\n    index: ${String(nth)}`;
}

function tapOf(target: string): string {
  return onOf({ command: 'tapOn', target });
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
    case 'scroll':
      return action.target.trim() === ''
        ? [SWIPES[action.value] ?? '- scroll']
        : [
            `- scrollUntilVisible:\n    element:\n      text: ${yamlText(`.*${pattern(action.target)}.*`)}\n    direction: ${action.value === 'up' ? 'UP' : action.value === 'left' ? 'LEFT' : action.value === 'right' ? 'RIGHT' : 'DOWN'}`,
          ];
    case 'long_press':
      return [onOf({ command: 'longPressOn', target: action.target })];
    case 'drag':
      return [
        `# drag ${yamlText(action.target)} onto ${yamlText(action.value)}: Maestro has no drag from one element to another, so do this by hand`,
      ];
    case 'hover':
    case 'upload':
      return [
        `# ${action.kind} ${yamlText(action.target)}: a phone has no ${action.kind}`,
      ];
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
