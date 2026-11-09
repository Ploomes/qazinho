import type { ICodeExport } from './types';
import type { CodeRead, ExportOutcome, IExportCode } from '@/shared/types';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import {
  casesOf,
  readBook,
  readFileRef,
  recipeFor,
} from '@/main/classes/runs/RunCoordinator/library';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import { sampleFileOf } from '@/main/library';
import { CODE_EXPORT } from './constants';
import { maestroOf, playwrightOf } from './library';

/**
 * Escreve os casos que as runs de um workspace gravaram como código que o QA guarda: um
 * teste Playwright para um app web, um fluxo Maestro por caso para um app de celular.
 */
export class CodeExport {
  private readonly dataRoot: string;
  private readonly chooseFolder: ICodeExport['chooseFolder'];
  private readonly appIdOf: ICodeExport['appIdOf'];

  public constructor(props: ICodeExport) {
    this.dataRoot = props.dataRoot;
    this.chooseFolder = props.chooseFolder;
    this.appIdOf = props.appIdOf;
  }

  /**
   * Exporta todo caso cuja receita ainda casa com o que o caso diz, numa pasta que o QA
   * escolhe, e diz quais casos ainda não têm nenhuma.
   */
  public async export(request: IExportCode): Promise<ExportOutcome> {
    const built = await this.build(request);

    if (built.kind !== 'built') return built;

    const folder = await this.chooseFolder();

    if (folder === null) return { kind: 'cancelled' };

    const isWritten = await Promise.all(
      built.files.map(async ({ name, content }) => {
        await mkdir(dirname(join(folder, name)), { recursive: true });
        await writeFile(join(folder, name), content);
      }),
    ).then(
      () => true,
      () => false,
    );

    if (!isWritten) return { kind: 'failed', reason: 'write' };

    return {
      kind: 'saved',
      folder,
      files: built.files.map(({ name }) => name),
      exported: built.exported,
      missing: built.missing,
    };
  }

  /** O mesmo código como texto, sem pasta: o agente de fora o guarda onde quiser. */
  public async read(request: IExportCode): Promise<CodeRead> {
    const built = await this.build(request);

    if (built.kind !== 'built') return built;

    return {
      kind: 'code',
      files: built.files.flatMap(({ name, content }) =>
        typeof content === 'string' ? [{ name, content }] : [],
      ),
      samples: built.files.flatMap(({ name, content }) =>
        typeof content === 'string' ? [] : [name],
      ),
      exported: built.exported,
      missing: built.missing,
    };
  }

  private async build(request: IExportCode): Promise<
    | { kind: 'nothing'; missing: string[] }
    | { kind: 'failed'; reason: 'app-id' }
    | {
        kind: 'built';
        files: { name: string; content: string | Buffer }[];
        exported: string[];
        missing: string[];
      }
  > {
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

    const uploads = recorded.flatMap(({ recipe }) =>
      recipe.steps.flatMap(({ actions }) =>
        actions.filter(({ kind }) => kind === 'upload'),
      ),
    );
    const samples = [
      ...new Set(
        uploads.flatMap(({ value, files }) => (files === undefined ? [value] : [])),
      ),
    ].map((kind) => sampleFileOf(kind));
    const ownFiles = await Promise.all(
      [...new Set(uploads.flatMap(({ files }) => files ?? []))].map(async (file) => ({
        name: basename(file),
        bytes: await readFile(
          readFileRef(file) === null
            ? file
            : join(
                this.dataRoot,
                ARCHIVE.workspaces,
                request.workspaceId,
                ARCHIVE.files,
                file,
              ),
        ).catch(() => null),
      })),
    );
    const files: { name: string; content: string | Buffer }[] = isWeb
      ? [
          {
            name: CODE_EXPORT.playwrightFile,
            content: playwrightOf({
              url: request.target.value,
              viewport: request.viewport,
              cases: recorded,
            }),
          },
          ...[
            ...samples,
            ...ownFiles.flatMap(({ name, bytes }) =>
              bytes === null ? [] : [{ name, bytes }],
            ),
          ].map(({ name, bytes }) => ({
            name: join(CODE_EXPORT.samplesFolder, name),
            content: bytes,
          })),
        ]
      : recorded.map(({ steps, recipe }) => ({
          name: `${recipe.caseId.toLowerCase()}${CODE_EXPORT.maestroExtension}`,
          content: maestroOf({ appId, steps, recipe }),
        }));

    return {
      kind: 'built',
      files,
      exported: recorded.map(({ recipe }) => recipe.caseId),
      missing,
    };
  }
}
