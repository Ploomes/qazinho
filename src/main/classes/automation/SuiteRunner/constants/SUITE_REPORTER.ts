export const SUITE_REPORTER = {
  file: 'qazinho-reporter.cjs',
  prefix: 'QAZINHO-SUITE ',
  source: String.raw`'use strict';

const PREFIX = 'QAZINHO-SUITE ';
const ANSI = /\u001b\[[0-9;?]*[A-Za-z]/g;
const LONGEST = 4000;

function clean(text) {
  return String(text || '').replace(ANSI, '').trim().slice(0, LONGEST);
}

class QazinhoReporter {
  constructor(options) {
    this.out = (options && options.out) || ((line) => process.stdout.write(line));
  }

  printsToStdio() {
    return true;
  }

  send(event) {
    this.out(PREFIX + JSON.stringify(event) + '\n');
  }

  onBegin(config, suite) {
    this.send({ kind: 'begin', total: suite.allTests().length });
  }

  onTestBegin(test, result) {
    this.send({ kind: 'test-begin', id: test.id, retry: result.retry });
  }

  onStepBegin(test, result, step) {
    if (step.category === 'test.step' || step.category === 'expect')
      this.send({ kind: 'step', id: test.id, title: clean(step.title) });
  }

  onTestEnd(test, result) {
    const project = test.parent.project();
    const error = (result.errors || [])[0];

    this.send({
      kind: 'test-end',
      id: test.id,
      title: test.title,
      file: test.location.file,
      line: test.location.line,
      project: (project && project.name) || '',
      status: result.status,
      outcome: test.outcome(),
      retry: result.retry,
      durationMs: Math.round(result.duration),
      error: error ? clean(error.message || error.value) : null,
      attachments: (result.attachments || [])
        .filter((attachment) => attachment.path)
        .map((attachment) => ({
          name: attachment.name,
          contentType: attachment.contentType,
          path: attachment.path,
        })),
    });
  }

  onError(error) {
    this.send({ kind: 'error', message: clean(error.message || error.value) });
  }

  onEnd(result) {
    this.send({ kind: 'end', status: result.status });
  }
}

module.exports = QazinhoReporter;
`,
} as const;
