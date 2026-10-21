import type { ICodeExport } from './types';
import type { ExportOutcome, IExportCode } from '@/shared/types';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { casesOf, readBook, recipeFor } from '@/main/classes/runs/RunCoordinator/library';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { CODE_EXPORT } from './constants';
import { maestroOf, playwrightOf } from './library';

/** Writes the cases a workspace's runs recorded as code the QA keeps: a Playwright test file for a web app, a Maestro flow per case for a phone app. */
export class CodeExport {
  private readonly dataRoot: string;
  private readonly chooseFolder: ICodeExport['chooseFolder'];
  private readonly appIdOf: ICodeExport['appIdOf'];

  public constructor(props: ICodeExport) {
    this.dataRoot = props.dataRoot;
    this.chooseFolder = props.chooseFolder;
    this.appIdOf = props.appIdOf;
  }

  /** Exports every case whose recipe still matches what the case says, into a folder the QA picks, and says which cases have none yet. */
  public async export(request: IExportCode): Promise<ExportOutcome> {
    const book = readBook(
      await readFile(
        join(this.dataRoot, ARCHIVE.workspaces, request.workspaceId, ARCHIVE.recipes),
        'utf8',
      ).catch(() => null),
    );
    const found = casesOf(request.steps).map((walked) => {
      const steps = walked.map(({ step }) => step);

      return {
        caseId: steps[0]?.caseId ?? '',
        steps,
        recipe: recipeFor({ book, steps, targetKind: request.target.kind }),
      };
    });
    const missing = found.flatMap(({ caseId, recipe }) =>
      recipe === null ? [caseId] : [],
    );
    const recorded = found.flatMap(({ steps, recipe }) =>
      recipe === null ? [] : [{ steps, recipe }],
    );

    if (recorded.length === 0) return { kind: 'nothing', missing };

    const isWeb = request.target.kind === 'web';
    const appId = isWeb ? '' : await this.appIdOf(request.target);

    if (appId === null) return { kind: 'failed', reason: 'app-id' };

    const folder = await this.chooseFolder();

    if (folder === null) return { kind: 'cancelled' };

    const files = isWeb
      ? [
          {
            name: CODE_EXPORT.playwrightFile,
            text: playwrightOf({
              url: request.target.value,
              viewport: request.viewport,
              cases: recorded,
            }),
          },
        ]
      : recorded.map(({ steps, recipe }) => ({
          name: `${recipe.caseId.toLowerCase()}${CODE_EXPORT.maestroExtension}`,
          text: maestroOf({ appId, steps, recipe }),
        }));
    const isWritten = await Promise.all(
      files.map(({ name, text }) => writeFile(join(folder, name), text)),
    ).then(
      () => true,
      () => false,
    );

    if (!isWritten) return { kind: 'failed', reason: 'write' };

    return {
      kind: 'saved',
      folder,
      files: files.map(({ name }) => name),
      exported: recorded.map(({ recipe }) => recipe.caseId),
      missing,
    };
  }
}
