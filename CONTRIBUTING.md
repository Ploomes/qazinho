# Contribuindo

## Configuração

```bash
git clone --recurse-submodules https://github.com/Ploomes/qazinho.git
npm install
npm run dev
```

O harness vive no próprio repositório, com checkout como submódulo em
`packages/qazinho-harness`; o `npm install` o constrói. Num clone feito sem
`--recurse-submodules`, rode `git submodule update --init --recursive` antes.

## Antes de abrir um PR

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
npm run build
```

O CI roda todos eles.

## Branches e commits

As branches são `feat/<description>` ou `fix/<description>`. Os commits são
[convencionais](https://www.conventionalcommits.org/): `feat`, `fix`, `docs`, `test`, `refactor`,
`style`, `chore`, `ci`, `build`. Commits e as descrições deles ficam em inglês.

A versão é calculada a partir desses commits, então o tipo não é cosmético: `feat` gera uma minor,
`fix` gera uma patch, um rodapé `BREAKING CHANGE:` gera uma major, e todo o resto não gera nada.

Mantenha os commits pequenos e com um propósito só. Nunca misture mudanças não relacionadas.

## Como o código deve parecer

As `.claude/rules/` são o guia de estilo de verdade, e ele é curto:

| Regra                                            | Onde                      |
| ------------------------------------------------ | ------------------------- |
| processos, IPC, padrões de segurança             | `rules/architecture.md`   |
| uma classe por pasta, um tipo por arquivo, nomes | `rules/code-structure.md` |
| comentários: uma linha ou nenhum                 | `rules/comments.md`       |
| o que um teste precisa cobrir                    | `rules/testing.md`        |
| os dois tsconfigs, CI, releases                  | `rules/tooling.md`        |

Duas que pegam as pessoas de surpresa:

- **O renderer não pode importar Node nem Electron.** Ele é uma página web. O `tsconfig.web.json`
  não tem tipos do Node, então um deslize falha o typecheck em vez do runtime de alguém.
- **Toda função exportada de uma pasta `library/` tem um teste.**

## Idioma

O código é em inglês: nomes, strings, nomes de testes e commits. A prosa, os `.md`, o JSDoc e os
comentários dos testes, é em português do Brasil.

## Lançando versões

Manual, por `workflow_dispatch` no workflow `Release`. Fazer merge na `main` não lança nada.
