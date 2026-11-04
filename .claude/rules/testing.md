# Testes

Vitest. `node` para `src/main` e `src/shared/types`, `jsdom` para qualquer coisa da página.

| Comando              | O quê                                           |
| -------------------- | ----------------------------------------------- |
| `npm test`           | todo teste unitário                             |
| `npm run test:watch` | o mesmo, observando                             |
| `npm run test:smoke` | `tests/smoke/`: o agente real, o navegador real |

## `__tests__/` ao lado do código

```
src/main/library/
├── isInternalNavigation.ts
└── __tests__/isInternalNavigation.test.ts

src/shared/components/atoms/Button/hooks/useButtonViewModel/
├── index.ts
└── __tests__/useButtonViewModel.test.ts
```

Um teste vive ao lado do que testa, não ao lado da pasta que o contém. O Vitest pega
`src/**/__tests__/**/*.test.{ts,tsx}`, e o electron-vite nunca os empacota porque nada os
importa.

## O que precisa ter um teste

- **Todo view model.** Um `describe` por função exposta, e os casos que importam: o caminho feliz,
  o caminho que **não** pode acontecer e a borda.
- **Toda função exportada de `library/`.** Quem chama exercita um caminho; a função tem vários.
- **Toda tabela de constantes**, nas bordas dela.
- **O guarda de navegação**: mesma origem, outra porta, um hash na página empacotada, outro
  arquivo no disco, `javascript:` e uma string que não é uma URL.

Uma view não é testada. Ela não tem lógica, então não há nada a afirmar que o view model já não
cubra.

## Regras

- **Nada de mock de módulo.** Fakes escritos à mão sobre uma porta. Se um teste precisa de
  `vi.mock`, uma dependência vazou. Um colaborador chega por props ou pelos argumentos do view
  model.
- **Mantenha o `electron` fora da `library/`.** Uma função que recebe valores simples é testada
  com valores simples; a chamada do Electron fica na classe ou no `index.ts`. É por isso que o
  `isInternalNavigation` recebe duas strings e não um `WebContents`.
- **Os nomes dos testes descrevem comportamento, não métodos.** `'another port on localhost is
another origin'`, nunca `'isInternalNavigation() returns false'`.
- **Os testes não usam a rede**, e não sobem um emulador, um simulador nem um navegador.
- Um arquivo de teste da página declara o ambiente dele no topo: `// @vitest-environment jsdom`.

## `tests/smoke/`, e por que ele não está no `npm test`

Suítes que precisam de algo real por trás. Elas têm a própria config (`tests/vitest.smoke.ts`), o
próprio comando, e o CI nunca as roda.

| Arquivo                | O que ele dirige                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `run.test.ts`          | o produto: Chrome real, o agente do próprio QA, um plano andado e julgado               |
| `chat.test.ts`         | o agente do próprio QA planeja no schema, e fica sabendo de uma run ao retomar          |
| `visual.test.ts`       | o agente do próprio QA reprova uma página cujo texto está certo e a tela não            |
| `page.test.ts`         | `out/renderer` num Chrome comum, sem bridge: a página não pode quebrar                  |
| `electron.test.ts`     | a janela empacotada, onde `window.qazinho` é o preload real                             |
| `stream.test.ts`       | Chrome sem janela como MJPEG em loopback, enquadrado na página, nítido em foco          |
| `stop.test.ts`         | Stop termina uma run enquanto um agente fake ainda está pensando                        |
| `resize.test.ts`       | o dispositivo redimensionado no meio da run: os casos que vêm recebem o tamanho         |
| `cost.test.ts`         | o agente de cada caso, terminado com Ctrl+C, diz quanto custou antes da run             |
| `finding.test.ts`      | um bug registrado ao lado de um passo: a tela dele, e o caso seguinte avisado           |
| `agent.test.ts`        | um agente fake tenta de novo uma ação que falhou, deixa uma nota, ou dá erro            |
| `codex.test.ts`        | um Codex fake conversa no schema estrito, retoma, roda um caso, sai da conta            |
| `tools.test.ts`        | um cliente MCP chama toda ferramenta do dispositivo no Chrome real, as APIs             |
| `design.test.ts`       | um agente e um explorador fakes recebem o Figma, medem a tela, registram                |
| `locate.test.ts`       | controles parecidos numerados, campos com rótulo, um dropdown, uma data                 |
| `dialog.test.ts`       | um confirm respondido OK ou Cancelar, um prompt digitado, e o look avisando             |
| `tabs.test.ts`         | a nova aba de um link e uma janela de login: o dispositivo vai a elas e volta           |
| `peek.test.ts`         | um Chrome sem janela lê uma página para o chat, ou diz por que não abriu                |
| `fresh.test.ts`        | um caso começa num navegador sem nada salvo, e o stream o acompanha                     |
| `device-fresh.test.ts` | apps de fixture num AVD e num simulador reais: limpos, reabertos, segurados             |
| `save.test.ts`         | o lightbox baixa um screenshot pela main, para onde o diálogo diz                       |
| `setup.test.ts`        | o instalador roda um npm fake, transmite as linhas e falha com honestidade              |
| `terminal.test.ts`     | um programa de tela cheia fora de vista: a tela lida, as teclas, a página               |
| `mcp.test.ts`          | um `/mcp` e um Codex fakes: o MCP do Figma adicionado, logado, recusado, cancelado      |
| `login.test.ts`        | um `claude` e um `codex` fakes: login num terminal, status lido, sem terminal, cancela  |
| `record.test.ts`       | o app construído grava uma run web como um MP4 H.264 pela janela escondida              |
| `github.test.ts`       | um gh fake: login por código de dispositivo e cancelar, repositórios, branches          |
| `jira.test.ts`         | um site do Jira fake: histórias buscadas e lidas, os arquivos delas baixados            |
| `confluence.test.ts`   | um site do Confluence fake: uma página buscada e lida, um plano publicado duas vezes    |
| `filing.test.ts`       | um Jira e um gh fakes: um bug registrado com arquivos e história, recusas em palavras   |
| `review.test.ts`       | um agente fake pesa um bug visto de novo contra a issue num Jira fake                   |
| `assistant.test.ts`    | um agente fake age pelas ferramentas do app: uma página que responde, espera, ou não    |
| `build.test.ts`        | um gh fake entrega uma branch e um agente fake a constrói: um APK guardado              |
| `replay.test.ts`       | um caso gravado, andado de novo sem agente, consertado quando o app muda                |
| `explore.test.ts`      | um explorador fake no Chrome real: telas, um bug, um plano e o relógio                  |
| `variables.test.ts`    | um agente fake entra com `${NAME}`: a página recebe o valor, o agente não               |
| `ask.test.ts`          | um agente fake pergunta ao QA no meio da run: uma escolha, um código, silêncio, um stop |
| `network.test.ts`      | Chrome real: cada pedido guardado com status, tempo e tamanho, segredos fora            |
| `strip.test.ts`        | o app construído: os pedidos de uma run sob o vídeo, e baixados desenhados nele         |
| `island.test.ts`       | o app construído: a janela da ilha transparente, no Dock, sem corte, setas e teclado    |
| `outside.test.ts`      | um cliente MCP real no app construído: token, navegador, rodar, esperar, parar, sugerir |
| `update.test.ts`       | o app construído num feed e numa API fakes: baixa sozinho, o botão, a tela de recusa    |

O `run.test.ts`, o `chat.test.ts` e o `visual.test.ts` gastam os tokens do QA e precisam de um
agente instalado. Rode-os à mão depois de mexer no pipeline da run ou no schema de uma resposta.

**Um clique sintético não é um clique.** O Playwright dirige a página pelo CDP, que pula o hit
test que o gerenciador de janelas faz — então um `-webkit-app-region: drag` engolindo um clique
de verdade é **invisível a toda suíte daqui, a do Electron incluída**. O que o pega é ler a
propriedade computada de cada controle, o que o `page.test.ts` faz para a barra de título. Toda
regra que o SO impõe em vez da página precisa do mesmo tratamento: afirme a declaração, não o
comportamento.
