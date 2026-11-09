import type { ICaseRecipe } from '@/main/classes/runs/RunCoordinator/types';
import type { IFlatStep, IStepAction } from '@/shared/types';
import { ordinalOf, proofLinesOf, withoutRole } from '@/main/library';
import { variablesIn } from './variablesIn';

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

/**
 * Um fluxo Maestro para um caso que as runs de um app de celular gravaram: o app aberto
 * de novo, cada passo feito, e a prova afirmada na tela; uma variável vem do ambiente.
 */
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
      ...shownOf(kept?.proof ?? '').map(
        (shown) => `- assertVisible: ${yamlText(`.*${pattern(shown)}.*`)}`,
      ),
    ];
  });

  const variables = variablesIn([props.recipe]);

  return [
    ...(variables.length === 0
      ? []
      : [
          `# Types the project's variables from the environment: maestro test ${variables.map((name) => `-e ${name}=…`).join(' ')}`,
        ]),
    `appId: ${props.appId}`,
    `name: ${yamlText(`${first?.caseId ?? props.recipe.caseId} · ${first?.caseTitle ?? ''}`)}`,
    '---',
    '- launchApp:',
    '    clearState: true',
    ...body,
    '',
  ].join('\n');
}

function yamlText(text: string): string {
  return JSON.stringify(text);
}

function pattern(text: string): string {
  return text
    .split(/(\$\{[A-Z][A-Z0-9_]*\})/)
    .map((part, index) =>
      index % 2 === 1 ? part : part.replace(/[\\^$.|?*+()[\]{}]/g, '\\$&'),
    )
    .join('');
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
    case 'open_download':
    case 'tab':
      return [
        `# ${action.kind} ${yamlText(action.target)}: a phone has no ${action.kind}`,
      ];
  }
}

function shownOf(proof: string): string[] {
  const lines = proofLinesOf(proof);

  return lines.length === 0 ? [proof] : lines;
}
