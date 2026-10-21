import type { IAppPort, IToolDone } from '@/modules/Assistant/types';
import type { AppToolCall, VariableFailure } from '@/shared/types';
import { findByRef } from './findByRef';
import { variableRefOf } from './variableRefOf';

const FAILURES: Record<VariableFailure['reason'], string> = {
  'no-keychain': 'this machine has no keychain to seal a value with',
  'no-bridge': 'QAzinho is not talking to the machine',
  'bad-name': 'a name takes capitals, digits and _, starting with a letter',
  taken: 'the project already keeps that name',
  'no-value': 'a new variable needs a value, which only the QA types',
  missing: 'the project no longer keeps it',
};

/** Asks the QA for a project's variables in the window, or renames one or changes what it holds, never touching a value. */
export async function performVariables(props: {
  call: Extract<AppToolCall, { name: 'ask_variables' | 'update_variable' }>;
  port: IAppPort;
}): Promise<IToolDone> {
  const { call, port } = props;
  const state = port.read();
  const found = findByRef({
    items: state.projects,
    ref: call.args.project,
    noun: 'project',
  });

  if (!found.isFound) return { text: found.text, isError: true };

  const project = found.item;
  const where = `${project.id} "${project.name}"`;
  const kept = state.variables[project.id] ?? [];

  if (call.name === 'ask_variables') {
    const saved = await port.askVariables({
      projectId: project.id,
      drafts: call.args.variables.map(({ name, description }) => ({
        name: variableRefOf(name),
        description,
      })),
    });

    if (saved === null)
      return {
        text: `The QA closed the window without keeping anything in ${where}.`,
        isError: false,
      };

    return {
      text: `The QA kept ${saved.map((name) => `\${${name}}`).join(', ')} in ${where}. Their values are sealed: a step names each as \${NAME}, and you never see one.`,
      isError: false,
    };
  }

  const variable = kept.find(({ name }) => name === variableRefOf(call.args.variable));

  if (variable === undefined)
    return {
      text:
        kept.length === 0
          ? `${where} keeps no variables yet.`
          : `${where} keeps no variable called ${call.args.variable}. It keeps ${kept.map(({ name }) => `\${${name}}`).join(', ')}.`,
      isError: true,
    };

  const name =
    call.args.name === undefined ? variable.name : variableRefOf(call.args.name);
  const outcome = await port.applyVariables({
    projectId: project.id,
    changes: [
      {
        kind: 'save',
        name,
        description: call.args.description ?? variable.description,
        value: null,
        from: variable.name,
      },
    ],
  });

  if (!outcome.isSaved)
    return {
      text: `QAzinho could not change \${${variable.name}}: ${FAILURES[outcome.failure.reason]}.`,
      isError: true,
    };

  return {
    text:
      name === variable.name
        ? `Changed what \${${name}} holds in ${where}. Its value stays.`
        : `Renamed \${${variable.name}} to \${${name}} in ${where}, and in the plans that named it. Its value stays.`,
    isError: false,
  };
}
