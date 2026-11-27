# Ferramentas

## Comandos

| Comando                           | O que faz                                                         |
| --------------------------------- | ----------------------------------------------------------------- |
| `npm run dev`                     | abre o app com o renderer no servidor de dev do Vite              |
| `npm run dev:reset`               | o mesmo numa pasta de dados vazia: uma primeira execução, de novo |
| `npm run build`                   | constrói a main, o preload e o renderer em `out/`                 |
| `npm run preview`                 | abre o app a partir de `out/`                                     |
| `npm run package`                 | constrói um instalador para o SO atual em `release/`              |
| `npm run typecheck`               | `tsc` sobre os dois tsconfigs                                     |
| `npm run typecheck:fast`          | o mesmo pelo `tsgo`, um acelerador local                          |
| `npm run lint` / `lint:fix`       | ESLint                                                            |
| `npm run format` / `format:check` | Prettier                                                          |
| `npm test` / `test:watch`         | Vitest                                                            |
| `npm run test:smoke`              | o agente real e um navegador real — veja `testing.md`             |
| `npm run harness:build`           | instala e constrói o submódulo do harness                         |

## O harness é um submódulo

- `packages/qazinho-harness` é um submódulo git do repositório próprio do harness. Clone com
  `--recurse-submodules`, ou rode `git submodule update --init --recursive` uma vez.
- O `npm install` o constrói: o `postinstall` roda o `npm run harness:build`, o `npm ci` próprio
  dele e o `npm run build` dentro do submódulo. O desktop importa o `dist/` dele, nunca o fonte.
- O ESLint e o Prettier deixam `packages/` em paz: o harness faz o lint, o formato e os testes
  dele mesmo.
- O CI faz o checkout do submódulo com o `GH_DEVOPS_TOKEN`, o secret da org Ploomes que lê o
  repositório do harness, como nas outras esteiras da org.

## Dois tsconfigs, e o segundo é uma guarda

O `tsconfig.json` só referencia os outros dois, então o editor e o ESLint veem os dois.

| Config               | Cobre                                                                                  | Tipos         |
| -------------------- | -------------------------------------------------------------------------------------- | ------------- |
| `tsconfig.node.json` | `src/main`, `src/shared/types`, `src/shared/constants`, `electron/`, `tests/`, configs | `node`        |
| `tsconfig.web.json`  | todo `src/` menos `src/main`                                                           | `vite/client` |

**O `tsconfig.web.json` não tem tipos do Node.** Um `import 'node:fs'` na página ou em
`src/shared/types` não compila. O `src/shared/types` está nos dois de propósito: ele precisa
compilar em cada mundo.

Os dois são `composite` para poderem ser referenciados. O `typecheck` passa `--composite false`
com `--noEmit`, porque um projeto composite quer emitir declarações.

O `noUncheckedIndexedAccess` está ligado: `table[i]` é `T | undefined`. Prefira `for...of`,
`find` e `??` ao índice cru.

## Versões seguradas de propósito

| Segurada       | Porque                                               |
| -------------- | ---------------------------------------------------- |
| Vite 7         | o electron-vite 5 aceita o Vite `^5 \|\| ^6 \|\| ^7` |
| plugin-react 5 | o 6 exige o Vite 8                                   |
| TypeScript 5.9 | o typescript-eslint aceita o TypeScript `<6.1`       |

O Dependabot ignora essas majors. Levante-as juntas quando o electron-vite 6 e o typescript-eslint
suportarem as versões novas.

## Dois compiladores

| Pacote                       | Papel                                                        |
| ---------------------------- | ------------------------------------------------------------ |
| `typescript` 5.9             | **fonte da verdade**: `typecheck` e por baixo do ESLint      |
| `@typescript/native-preview` | TypeScript 7 como `tsgo`, só um auxiliar do `typecheck:fast` |

O `tsgo` não expõe a API JS de que as regras com tipos do typescript-eslint precisam. Quando os
dois discordam, o `tsc` vence.

## Imports absolutos

`@/*` → `./src/*`. Quatro lugares conhecem o alias:

| Onde            | Como                                                |
| --------------- | --------------------------------------------------- |
| `tsc`           | `paths` nos dois tsconfigs                          |
| `electron-vite` | `resolve.alias` para a main, o preload e o renderer |
| `vitest`        | `resolve.alias` no `vitest.config.ts`               |
| `eslint`        | o `eslint-import-resolver-typescript` lê o `paths`  |

## Prettier e ESLint

O Prettier é a única fonte de formatação; o ESLint não formata.

As regras que sustentam a estrutura: `max-params: 2`, `member-ordering`,
`consistent-type-imports`, `import-x/order` com o grupo `type` no topo, `../` banido por regex, os
limites de processo no `no-restricted-imports`, `react-hooks` na página, e `no-restricted-syntax`
sobre `**/*.class.ts`.

A config do ESLint é `eslint.config.mjs` porque o pacote não é `"type": "module"`: o preload em
sandbox do Electron precisa ser CommonJS, e o electron-vite escolhe o formato de saída a partir
desse campo.

## Husky

O `pre-commit` roda o `lint-staged`, que aplica `prettier --write` no que está staged. O ESLint
não roda no hook; o CI cobre.

## CI

`.github/workflows/ci.yml`, em todo PR e todo push na `main`: lint, typecheck, format, test,
build. Ele pula o download do binário do Electron, porque nada no CI abre o app.

## Lançando versões

`.github/workflows/release.yml`, **só `workflow_dispatch`**, com um input `dry_run`. Ele reverifica,
depois o semantic-release cria a tag, escreve o `CHANGELOG.md`, sobe a versão do `package.json` e
cria uma release no GitHub. **Nada é publicado no npm**: o pacote é privado.

A primeira release, a 0.1.0, conta a partir de `v0.0.0`, uma tag no primeiro commit do
repositório. As notas dela passam o que o corpo de uma release do GitHub aceita, então uma
release cujas notas são longas assim aponta para o `CHANGELOG.md` dela (`releaseBodyTemplate`).

**Os instaladores vão para a release do próprio `Ploomes/qazinho`**, a que o semantic-release
cria. O repositório é público, então o app instalado se atualiza dela sem token. Cada job publica com
o `GITHUB_TOKEN` (`contents: write`), cria a release se ela ainda não existe, e sobe o feed por
último, para um app nunca ler uma versão cujos arquivos ainda não chegaram. Enquanto eles sobem, a
release nova ainda não tem feed, e um app que procura nesse meio tempo só tenta de novo depois. O
app só lê a release mais nova: uma sem o feed de um sistema, como com o input `mac` desligado, deixa
esse sistema parado até a seguinte. Uma versão ruim não se desfaz, publique uma maior.

O `QAZINHO_UPDATE_TOKEN` só serve a um teste contra um repositório privado.

**O instalador do Windows é construído pela release.** Assim que o semantic-release cria a tag,
um runner Windows faz o checkout dela e empacota o `QAzinho-Setup-<version>.exe` com o
electron-builder, mais o `.blockmap` e o `latest.yml`. Ele sai sem assinatura até haver um
certificado, então o SmartScreen pergunta uma vez. O input `tag` constrói os instaladores de uma
release que já existe, e não lança nada.
**A Microsoft Store recebe um pacote à parte**, que o mesmo job de Windows gera
(`electron-builder --win appx`): o `QAzinho-<version>-x64.appx`. A loja o assina depois de
aprová-lo, então ele sai sem assinatura e fica na mesma release, onde o atualizador não o lê: ele
só lê os `latest*.yml`. Ele é enviado à mão no Partner Center, na conta da Ploomes. A identidade do pacote (`appx.identityName`, `appx.publisher`) é a que o Partner Center
dá ao app, e o `appx.publisherDisplayName` é "Ploomes", igual ao da conta. Só o Windows gera um, e
a loja leva de um a três dias para aprovar cada versão.
**O AppImage do Linux é construído do mesmo jeito**, num runner Linux: o
`QAzinho-<version>.AppImage` e o `latest-linux.yml`.
**Os instaladores do macOS são um workflow à parte**, o `macos-installer.yml`, já que um runner
Mac é cobrado a dez vezes um Linux e roda só para eles. A release o chama assim que cria a tag, a
menos que o input `mac` esteja desligado, e disparar o workflow com uma tag constrói os
instaladores de uma release que existe. Ele empacota, para arm64 e x64, o `.dmg` da primeira
instalação e o `.zip` que atualiza, mais os `.blockmap` e um `latest-mac.yml` com as duas
arquiteturas, assinados com o certificado Developer ID e notarizados com uma chave de API do App
Store Connect, a partir de cinco secrets: `APPLE_CERTIFICATE_P12` (o `.p12`, em base64),
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_API_KEY_P8` (o texto do arquivo `.p8`), `APPLE_API_KEY_ID` e
`APPLE_API_ISSUER`. Faltando qualquer um, ele não constrói nada: um `.dmg`
sem assinatura aparece como danificado num Mac, e um app sem assinatura não se atualiza.

| Commit                               | Efeito |
| ------------------------------------ | ------ |
| `feat: ...`                          | minor  |
| `fix: ...`                           | patch  |
| rodapé `BREAKING CHANGE: ...`        | major  |
| `docs:`, `test:`, `chore:`, `build:` | nenhum |

## Dependabot

Semanal, npm e github-actions. As devDependencies vêm agrupadas com o prefixo `chore`.
