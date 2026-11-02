# Arquitetura

Electron, construído pelo electron-vite. O Electron precisa de três processos, e eles rodam em
mundos diferentes. **O `src/` é o app**; o encanamento do Electron fica fora do caminho.

```
src/
├── main/            ← Node + Electron: a janela, o sistema de arquivos, processos filhos
├── shared/          ← o que toda parte do app alcança
│   ├── types/       ← contratos com que todo lado concorda; não importa nenhum deles
│   ├── constants/   ← valores que todo lado compartilha, os nomes dos canais de IPC incluídos
│   ├── components/  ← atoms, molecules, organisms, templates (components.md)
│   ├── hooks/       ← hooks usados entre módulos
│   └── styles/      ← tokens.css, base.css, animations.css
├── modules/         ← telas, agrupadas por domínio
├── store/  languages/
├── services/        ← os únicos que chamam a bridge; Recorder/ é o da janela do gravador
├── app/  index.tsx  index.html  recorder.ts  recorder.html  island.tsx  island.html
electron/
└── preload/     ← a bridge: expõe window.qazinho pelo contextBridge, nada mais
packages/
└── qazinho-harness/  ← o harness do produto, um submódulo git de um repositório próprio
```

Tudo sob `src/` que não é `src/main/` é **a página**: React, sem Node. A janela do gravador também
é uma página, uma segunda, sem React: o `recorder.html` carrega o `src/recorder.ts`, que inicia o
`Recorder` (`src/services/Recorder/`), o serviço que codifica o vídeo de uma run. A página
principal nunca o importa, então o `src/services/index.ts` o deixa de fora.

| Pasta              | Roda em                  | Pode importar                                                                   |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------- |
| `src/main`         | Node                     | `electron`, builtins do Node, o harness, `@/shared/types`, `@/shared/constants` |
| o harness          | Node, empacotado na main | o próprio repositório: nada do desktop                                          |
| `electron/preload` | um preload em sandbox    | `electron`, `@/shared/types`, `@/shared/constants`                              |
| a página           | a página                 | `@/shared/types` e o resto da página                                            |
| `src/shared/types` | todos os acima           | nada além do `/contract` puro do harness                                        |

## A fronteira é imposta, não combinada

- O `tsconfig.web.json` cobre a página **sem os tipos do Node** e exclui o `src/main`:
  `import 'node:fs'` não compila lá.
- O `no-restricted-imports` do ESLint bane os builtins do Node e o `electron` na página e em
  `src/shared/types`, e bane a página de importar `src/main`, `electron/` ou o harness. Só o
  `src/shared/types` e o `src/shared/constants` importam o `/contract` do harness.

## Padrões de segurança

Toda `BrowserWindow` recebe `contextIsolation: true`, `sandbox: true` e `nodeIntegration: false`.

- Um preload em sandbox só pode dar `require` no `electron` e em alguns polyfills. É por isso que
  ele fica fino, e por isso há um só: uma segunda entrada dividiria um chunk que ele não pode
  requerer. A janela do gravador abre com `RECORDER_ARGUMENT`, e o mesmo preload lhe entrega
  `window.qazinhoRecorder` no lugar de `window.qazinho`.
- O `will-navigate` é cancelado a menos que o `isInternalNavigation` diga que o destino é o
  próprio app.
- O `window.open` nunca abre uma janela: links `https:` vão para o navegador do sistema, todo o
  resto é negado.
- **O login de um MCP nunca passa pelo QAzinho.** O MCP do Figma vive no agente do próprio QA,
  Claude Code ou Codex: o QAzinho o adiciona lá e roda o login do próprio agente, e o token fica
  com o agente. Os comandos de cada agente são uma receita em `MCP_RECIPES`.
  - O Claude Code só faz login a partir das telas do `/mcp`. O `AgentTerminal` as abre num terminal
    que ninguém vê (`/usr/bin/expect`, em todo Mac) e o `nextMcpMove` aperta as teclas que um QA
    apertaria. Ele responde sim à pergunta de confiar na pasta só para a pasta do próprio agente do
    QAzinho.
  - A página que o Claude Code pede ao `$BROWSER` para abrir é pega e aberta pelo QAzinho, para o
    popup poder abri-la de novo. O Codex imprime a página dele (`codex mcp login`).
  - Cada passo chega à página como `McpSignInProgress`. O Terminal (`claude "/mcp"`) continua
    como o caminho de volta quando as telas escondidas não são as que o `nextMcpMove` conhece.
- **O login de um agente também nunca passa pelo QAzinho.** O `AgentLogin` abre o login do próprio
  agente (`claude auth login`, `codex login`) num terminal que o QA vê, como o Zed faz
  (`terminalScriptOf`), e confere o status do agente (`claude auth status`, `codex login status`)
  até ele entrar, relatando cada passo no `StepsPopup`.
  - O próprio agente abre a página dele no navegador do QA. O QAzinho nunca vê o terminal, nem
    recebe ou repassa um código ou token: o que o agente recebe fica com o agente.
  - Sem um terminal para abrir, o popup mostra o comando a rodar.
- **Nada pede ao QA que digite um comando.** Um fluxo que roda uma CLI a roda fora de vista e
  mostra os passos dele no `StepsPopup`, menos o login de um agente, que abre sozinho num terminal
  visível. O Terminal é só um caminho de volta depois de uma falha.
- **O token de um tracker nunca chega à página.** Ele cruza para a main uma vez, é conferido e é
  lacrado com o `safeStorage`; a página só vê a conta a que ele pertence. A main abre o do Jira
  para chamar o Jira (`IntegrationVault.jira`).
- **O valor de uma variável nunca sai da main depois de lacrado.** O `VariableVault` guarda as
  variáveis de cada projeto num arquivo lacrado com o `safeStorage`, e nenhum canal devolve um
  valor: a página e os agentes conhecem um nome e o que ele guarda. Um campo que mostra o que foi
  digitado ainda o mostra na foto da tela que o agente recebe.
  - A página manda um valor só para salvá-lo, pela janela do projeto ou pela janela que um agente
    pede (`VariablesModal`), ou como a resposta secreta à pergunta de uma run, que só aquela run
    digita, a menos que o QA a guarde. Nenhuma ferramenta do app carrega um, e o Estagiário só
    ouve nomes.
  - Uma run alcança o dispositivo pela `variablePort`: um `${NAME}` é digitado como o valor dele,
    todo valor que aparece é lido de volta como o nome dele, na tela e no porquê de uma ação
    falhar, e uma receita guarda o nome, nunca um locator que contenha um valor. Uma prova é
    gravada com a variável pelo nome dela, e só com o que o texto da tela mostra (`provableProof`):
    o agente também copia da foto, e uma prova assim nunca seria achada numa run sem ele.
  - Um teste importado que lê uma credencial do ambiente ou do `.env` vira uma variável do
    projeto no plano (`role/chat/import.md`): o agente copia o nome, nunca um valor.
  - No Linux, o Electron lacra com uma chave fixa quando não há GNOME Keyring nem KWallet, e ainda
    diz que consegue criptografar: o `isSealable` recusa isso, para as variáveis e para o token do
    Jira.
  - Uma senha ou um token escrito num plano é uma variável esperando para ser guardada: a aba
    Plano nomeia o caso que o escreve e o lacra em um clique, escrevendo `${NAME}` no lugar dele
    (`writtenSecretsOf`), ou aceita a palavra do QA de que não é segredo (`plainValues`). Os dois
    chats seguram uma mensagem que carrega um (`secretIn`).
- **O login do GitHub também nunca passa pelo QAzinho.** O QAzinho fala com o GitHub pela GitHub
  CLI do próprio QA (`GithubCli`), do mesmo jeito que dirige o agente do QA, e não guarda token.
  - Conectar roda o device flow do gh fora de vista; o popup mostra o código de uso único e abre o
    GitHub. Um gh já logado conecta na hora, e um que falta `repo` ou `read:org` é pedido de novo
    com `gh auth refresh`.
  - O gh é leve, então o QAzinho o instala pelo Homebrew quando o QA pede.
  - Desconectar só faz o QAzinho parar de usá-lo: o gh continua logado para as outras ferramentas
    do QA.
- **O agente roda na pasta própria de agente do QAzinho** (`PATHS.agentHome`), chat e runs
  igualmente, então nenhuma configuração `.claude` de projeto alcança o agente do QA. O Claude
  Code também roda com os hooks do próprio QA desligados (`AGENT_RUN.settings`): um hook que
  reescreve comandos, como o do rtk, quebrava as permissões de todo build. Os hooks gerenciados
  de uma empresa ainda rodam.
- O `index.html` carrega uma CSP. Afrouxe uma diretiva com um motivo, nunca a política inteira.

## O workspace

Um workspace são três colunas: a sidebar, o chat no meio, e um painel ao lado (`SidePanel`) cujas
abas são o plano, o dispositivo (`DeviceView`), as runs e os bugs.

- Sem plano e sem run (`useChatOnly`), o chat é a tela: o painel Agente toma o espaço do centro,
  e o centro volta com um plano ou uma run.
- O chat está sempre lá; o QA escolhe a aba do painel (`panelTab`), e uma run que começa é a única
  coisa que a vira, para o dispositivo. O `selectTab('chat')` só traz o chat de volta.
- O painel mantém a largura a que o QA o arrasta, estreitada para o chat manter o
  `SHELL.centerMinWidth` (`panelWidthOf`). Ele se dobra num trilho com o nome da aba dele, ou se
  alarga sobre o chat, que continua montado, escondido e inerte, então um rascunho nunca se perde.
- O Estagiário ouve a aba ao lado do chat, ou que o painel está escondido (`describeScreen`).
- A sidebar se dobra num trilho com a plataforma e o estado de cada workspace (⌘B), guardado nas
  configurações entre reinícios; o chat e o painel medem o espaço deles pela largura dela
  (`useSidebarWidth`).

## IPC

- O contrato é o `IQazinhoApi` em `src/shared/types/`. O preload o implementa, e a página o lê de
  `window.qazinho`, tipado em `src/global.d.ts`.
- **Os nomes dos canais vivem em `src/shared/constants/CHANNELS.ts`**, e só a main e o preload os
  leem. Uma string escrita duas vezes é uma chamada que nunca responde e nunca dá erro. A página
  nunca vê um canal: ela passa por `src/services/`.
- **Exponha funções com um propósito, nunca o `ipcRenderer` em si.** Uma página que pode mandar
  qualquer canal é uma página com Node.
- O structured clone não carrega funções nem instâncias de classe. O que cruza é dado.
- A página nunca chama `window.qazinho` de uma view. Ela passa por `src/services/`.

## O harness

**Tudo o que o agente do QA ouve vive no harness**, um harness de produto que fica sobre o do
próprio agente (o do Claude Code), num repositório próprio que a API do QAzinho Pro também roda
(`qazinho-harness`). A main o roda, e a CLI do agente continua sendo o motor: nada de SDK. Ele
responde a uma pergunta por canal, para um alvo `{ role, platform }`:

| Canal   | Onde                     | Vira                                                               |
| ------- | ------------------------ | ------------------------------------------------------------------ |
| context | `context/corpus/**/*.md` | o prompt de sistema, pelo `--append-system-prompt`                 |
| tools   | `tools/`                 | o servidor MCP do QAzinho e o `--allowedTools` que um papel recebe |
| schemas | `schemas/`               | o formato que uma resposta precisa ter, pelo `--json-schema`       |

- **O desktop o recebe como pacote.** O `packages/qazinho-harness` é um submódulo git, dependência
  por `file:` (`@salve-software/qazinho-harness`) e construído pelo `npm run harness:build`, que o
  `postinstall` roda. O electron-vite empacota o `dist/` dele na main, o corpus incluído, enquanto
  zod, yaml e o SDK do MCP continuam dependências do próprio app. As `.claude/rules/` dele
  descrevem o que é dele; o que segue é o que o desktop usa.
  - **Os tipos que a main divide com a página vêm do `/contract` do harness**: cada arquivo de
    `src/shared/types` que o harness também lê reexporta um tipo de lá, então os schemas zod, a
    main e a página guardam uma definição só. O `VARIABLE_NAME` vem do mesmo jeito.
  - **Mover o harness** é um commit que move o submódulo e roda o `npm run harness:build`; uma
    mudança no que o agente ouve aparece primeiro como um diff dos prompts fixados do harness.
- **O corpus é prosa em `.md`, uma seção `## Título` por arquivo.** Onde um arquivo vive diz quem
  o lê: `universal/` toda chamada, `role/<role>/` um papel (`chat`, `runner`, `explorer`,
  `assistant`, `builder`, `reporter`), `platform/<x>.md` um dispositivo. O `order` do
  frontmatter ordena uma camada. As camadas vão da mais estável à menos estável. O `{{app}}` é
  preenchido por chamada; um placeholder que nada preenche lança erro.
- **O prompt de sistema de um chat é só o corpus.** O Claude Code mantém o prompt de sistema com
  que uma sessão começou e ignora um `--append-system-prompt` novo no `--resume`. O que uma
  mensagem acrescenta (o workspace, as últimas runs dele, o que o `AppPeek` viu, as referências
  @) abre a mensagem dentro de `<qazinho>`, e só o que mudou desde que a sessão leu pela última
  vez (`changedSections`).
- **Uma run é andada por agentes próprios.** Cada caso recebe um agente novo com o prompt do
  runner e as ferramentas do dispositivo, e nada do chat.
- **Um bug visto de novo cai no que está aberto.** Cada run carrega os bugs do workspace
  (`IStartRun.bugs`), e o agente de cada caso e o explorador ouvem os mais recentes deles
  (`describeKnownBugs`). O `bug` e o `report` recebem `sameAs` com um dos ids deles, mantido só
  quando a run foi avisada dele (`keptBugId`).
  - A página registra uma falha ou um achado com `catchBug`: no bug nomeado, senão no bug em que o
    passo do plano falhou, senão num com o mesmo título, senão como um bug novo.
  - O bug guarda cada vez em que foi visto, com a run, o passo, o momento e a tela; uma run que já
    o pegou não muda nada.
- **Um caso que passou é andado de novo sem o agente.** A run dele grava as ações de cada passo, e
  o agente relata, a cada passagem, uma `proof`: palavras na tela que não estariam lá se tivesse
  falhado.
  - Um caso cujos passos todos passaram com uma prova vira uma receita, guardada na pasta do
    workspace (`recipes.json`), com a chave do que o caso diz e do tipo de alvo
    (`fingerprintOf`). Um passo web também guarda o locator do Playwright que usou, e um arrasto,
    o alvo em que soltou.
  - A próxima run anda um caso com receita no dispositivo sem o agente e confere cada prova
    (`replayCase`): custa nada e leva segundos. Quando uma prova não aparece, o caso recomeça com
    o agente, que o grava de novo, e os passos dele aparecem como curados.
  - "Rodar tudo com o agente", no menu do botão de rodar (`RunButton`), anda todo caso com o
    agente; cada jeito diz no menu o que faz. O relatório diz "sem IA" ou "curado" em cada caso, e
    o `CodeExport` transforma as receitas num arquivo de Playwright ou num fluxo de Maestro por
    caso. O agente do chat fica sabendo como as runs foram pelo histórico que a mensagem seguinte
    carrega (`runHistoryOf`): a última run passo a passo, as anteriores pelo que quebrou.
- **Uma exploração é andada por um agente só, sem plano** (`role/explorer/`). Ele recebe o
  dispositivo por um tempo definido com `screen`, `bug` e `finish` no lugar do `report`
  (`TOOLS_LEFT_OUT`):
  - Cada ação responde com o tempo que resta, e nenhuma é executada depois que ele acaba; um
    finish com mais de um terço dele sobrando é devolvido uma vez (`earlyFinish`).
  - Cada tela que ele anota é um passo de um caso só (`EXPLORATION.caseId`), cada bug um achado
    na tela anotada por último, e o finish o plano que ele sugere, que o chat guarda num cartão
    até o QA levá-lo ao plano (`takeSuggestion`). O agente do chat o ouve no histórico de runs.
- **O agente pergunta ao QA no meio da run** (`ask_qa`, `asking-the-qa.md` em `role/runner/` e
  `role/explorer/`). A chamada segura até o QA responder:
  - O `RunCoordinator` guarda a pergunta (`IOpenQuestion`) e avisa a página (`asked`). A página
    responde por `answerRun`, e como terminou volta como `answered`: as palavras do QA, um
    segredo pelo nome, nenhuma resposta depois de `RUN_WALK.askWaitMs` (15 minutos), ou um stop.
  - O relógio de turno do agente para enquanto ele espera (`AgentRunner.hold`), o relógio do
    explorador avança pela espera, e a config do MCP diz ao agente que uma chamada pode levar
    isso: o Claude Code segurou uma por 16 minutos.
  - Um segredo cruza para a main uma vez e vira uma variável da run, digitada pela
    `variablePort`: o agente lê `${NAME}`, e a página só vê o nome. O projeto a guarda quando o QA
    diz (`keepVariable`), e um caso que digitou uma dada só para aquela run não guarda receita.
  - As palavras do QA chegam ao agente com o valor de qualquer variável lido de volta como o nome
    dela.
  - A página segura a pergunta na run viva, a desenha como `AskCard` no fim do chat, e guarda como
    terminou na seção da run (`AskNote`) e no passo dela em Runs.
- **As ferramentas são concedidas por papel** (`TOOL_GRANTS`). O runner e o explorador recebem o
  dispositivo, o assistente recebe o app, e o chat recebe as fontes dele: `read_jira_story`,
  `search_confluence` e `read_confluence_page` (`servers/sources/`), mais as ferramentas de leitura
  do Figma do QA num workspace com design, e nenhuma outra ferramenta. O `McpHost` serve as
  ferramentas em loopback, um endereço por workspace pelo tempo de uma run, e um sob o escopo
  `~assistant` enquanto o assistente responde.
  - Toda chamada do agente pode usar os servidores MCP do próprio QA, como o da empresa dele: eles
    são do QA e ele responde por eles. O `AgentRunner` entrega a cada chamada do Claude Code o
    `--permission-prompt-tool` no `approve_permission` do QAzinho (`withPermissions`), servido ao
    lado das ferramentas de cada grupo e, para uma chamada sem nenhuma (um build, uma revisão),
    sozinho sob `~permissions`. Ele permite qualquer ferramenta MCP e nada mais (`permissionOf`):
    um arquivo fora das pastas de uma chamada continua fechado. O Codex deixa os servidores do QA
    ligados. O servidor do QAzinho ganha um nome que divide com um do QA, e o corpus
    (`universal/own-tools.md`) faz o agente fazer com as ferramentas do QAzinho o que elas fazem.
  - Uma chamada feita sem as permissões (o runner de um teste) as deixa de fora: o Claude Code
    roda com `--strict-mcp-config`, e o Codex com cada servidor do `config.toml` do QA desligado
    (`codexServersOf`), menos os que o QAzinho entrega à chamada. Sem uma ferramenta para
    respondê-lo, um servidor da Atlassian do QA uma vez deixou o chat pedindo a ela uma permissão
    que ninguém podia dar.
- **O Estagiário da barra de título é um agente próprio** (`role/assistant/`). Ele faz no QAzinho o que o QA
  faz à mão, pelas ferramentas do app (`servers/app/`), e fala de qualquer projeto, workspace, run
  ou bug:
  - Cada mensagem abre com o que está na tela e como o QAzinho está agora (`describeScreen`,
    `describeApp`), mandado de novo só quando mudou. A página monta esse retrato.
  - Uma chamada de ferramenta é lida contra o schema zod dela num `AppToolCall`, que a página
    executa pelas mesmas stores e services que os cliques do QA usam (`performAppTool`), e a
    resposta volta em palavras. O `AppBridge` da main entrega a chamada e espera a resposta.
  - O compilador mantém os schemas zod e o tipo `AppToolCall` presos um ao outro: uma ferramenta
    cujo schema e tipo se afastam não compila.
  - Apagar e desconectar esperam um cartão que o QA responde no chat, por até cinco minutos
    (`ASSISTANT_WAIT`). A config do MCP diz ao agente que uma chamada pode levar isso: o Claude
    Code lê o `timeout` do servidor, e o Codex o `tool_timeout_sec`.
  - Um caminho de build é feito inteiro e conferido no disco na main antes de a página saber dele.
    O token de um tracker continua sendo digitado pelo QA nas Configurações, nunca no chat, e o
    composer segura uma mensagem que carrega um (`secretIn`) até o QA tirá-lo ou insistir.
  - Um plano é escrito no chat do próprio workspace, nunca no do Estagiário:
    `ask_workspace_chat` manda o pedido do QA para lá em nome dele e o abre. Ele se recusa
    enquanto aquele chat responde, enquanto uma run anda, ou enquanto as perguntas dela esperam o
    QA, o que o `workspace_details` lê de volta para o Estagiário ajudar a respondê-las.
  - O chat e a sessão dele sobrevivem a um reinício (`keptOf`): as últimas mensagens, sem nada
    em andamento.
  - Ele também fala sozinho, num balão sob o rosto (`AssistantTip`, `say`), quando o QAzinho leva
    o QA a outro lugar ou precisa dizer algo que nenhuma tela diz: uma frase do que fazer ali. O
    rosto e o balão ficam numa camada acima de tudo: um rosto aceso em cima do botão, então um modal
    não o apaga e o X do chat aberto não aparece, e o balão que nasce dele (`STICKER.speak`) e digita
    a frase. Ele não pede resposta, não toma o foco e sai em alguns segundos pelo tamanho do texto
    (`holdMsOf`), menos com o mouse em cima. Um salto para consertar algo fecha o chat dele, que
    cobriria o botão apontado.
  - O botão dele mora na barra de título (`AssistantButton`), então nenhuma tela guarda espaço
    para ele: o composer do chat e o fim das listas ficam inteiros. O chat dele abre logo abaixo
    do botão, no canto direito (`AssistantDock`): sobre o painel Agente enquanto ele está aberto,
    e só com o painel recolhido sobre a ponta direita da coluna do meio, onde o dispositivo vive.
- **O app é construído a partir do próprio código, pelo agente do QA** (`role/builder/`). O cartão
  Android ou iOS de um projeto, ou o `build_app` do assistente, constrói o app a partir de uma
  branch de um dos repositórios do projeto, sem terminal:
  - O `AppBuilder` da main fixa a branch num commit e a desempacota em `builds/work/<build>`.
  - O agente recebe Bash, Read, Grep, Glob, Edit e Write, e os comandos de build que pode rodar
    sem pedir, só nessa pasta; nunca rm, git ou curl. O Codex trabalha num sandbox workspace-write
    com a rede ligada, com os caches dele guardados dentro da pasta.
  - O ambiente dele carrega o PATH do QA, o SDK do Android, o JDK do Android Studio e `CI=1`.
  - O QAzinho confere o que ele fez: um .apk que é um zip, ou um .app que o simulador roda e não
    um para um dispositivo. É achado onde o agente disse, ou nas pastas de saída de costume. É
    guardado em `builds/apps/<project>`, a cópia é apagada, e ele vira o alvo do projeto.
  - Cada passo, as palavras e os comandos do agente (com a pasta dita como `.`), e como o build
    terminou chegam à página como `IBuildEvent`.
- **O código planeja; o QA diz o que o app deve fazer** (`role/chat/code.md`). Um projeto nomeia
  os repositórios do GitHub dele, cada um com uma branch base e o id do GitHub que a listagem
  leu, pelo qual o QAzinho Pro o conhece depois que o GitHub o renomeia. O `/code` no chat escolhe
  um deles e uma branch, e o agente lê essa branch enquanto planeja:
  - O `CodeCopies` da main fixa a branch e a base em commits, desempacota o tarball da branch na
    pasta própria do workspace sob `code/`, e guarda o diff contra a base. A própria branch base
    significa o app inteiro, sem nada a comparar.
  - A mensagem abre com uma seção sobre a cópia: onde ela está, os commits, os arquivos mudados e
    onde está o diff (`describeCode`).
  - O Claude Code recebe `Read`, `Grep` e `Glob` só nessa pasta (`--tools`, `--add-dir`); qualquer
    coisa fora dela é recusada. O Codex lê com o próprio sandbox somente leitura.
  - A cópia é apagada assim que um plano volta, quando o workspace vai embora, e na próxima
    inicialização. O plano guarda de onde veio (`planSource`), e o agente fica sabendo uma vez
    que a cópia se foi.
- **O chat lê o que o QA nomeia.** A chave ou o link de uma história, o link ou o título de uma
  página basta: o agente lê pelas ferramentas de fonte, servidas sob o escopo do chat
  (`chat~<workspace>`) pelo turno, e a main busca com o Jira do próprio QA, do jeito que os
  comandos fazem (`fetchSource`). Os arquivos da história caem na pasta `jira/` do workspace, que
  o chat pode ler; o turno devolve o que leu, então o workspace o guarda como a fonte do plano, e
  a mensagem seguinte não o repete (`toldAfterReading`). Uma fonte não conectada, ou desligada,
  responde com o que o QA faz a respeito.
- **Uma história do Jira é o requisito** (`role/chat/jira.md`). O `/jira` no chat escolhe uma das
  histórias do QA, e o agente planeja a partir dela:
  - O `JiraApi` da main fala com o Jira Cloud como o QA: a busca do seletor, com a issue que uma
    chave digitada nomeia primeiro, uma issue lida com todo campo e os nomes deles, e os arquivos
    dela.
  - O `JiraStories` lê a história para um workspace (`jiraStoryOf`): a descrição e os comentários,
    do formato de documento da Atlassian para markdown (`adfToMarkdown`), e os critérios de
    aceitação de qualquer campo com nome para eles. Ele baixa as imagens, PDFs e textos que
    consegue ler para a pasta própria do workspace sob `jira/` (`filesToReadOf`, `fileNameOf`).
  - A mensagem abre com a história (`describeStory`), com o texto dela indentado para não poder
    nem abrir uma seção nem fechar o `<qazinho>`. O Claude Code lê os arquivos com `Read`, `Grep` e
    `Glob` só nessa pasta.
  - Os arquivos são apagados assim que um plano volta, quando o workspace vai embora, e na próxima
    inicialização. O workspace guarda a história (`issue`), que o cabeçalho e o plano dele abrem
    no Jira.
- **Uma página do Confluence também é um requisito, e o lugar onde um plano é publicado**
  (`role/chat/confluence.md`). O Confluence é ligado ao lado do Jira (`setConfluence`), assim que o
  `ConfluenceApi.check` o alcança com a conta do Jira:
  - O `ConfluenceApi` da main fala com o Confluence Cloud no site do Jira com o token lacrado do
    Jira (`askAtlassian`): os espaços, uma busca por título em CQL (`cqlOf`), uma página lida no
    formato de documento da Atlassian como markdown, e um plano publicado.
  - O `/confluence` no chat escolhe uma página. A main a lê para a mensagem (`describePage`), com o
    texto indentado como o de uma história, e a guarda para o workspace até um plano voltar. O
    workspace guarda a página (`sourcePage`), que o plano abre.
  - A aba Plano escreve o plano como blocos (`planDocOf`): de onde veio, os fatos de cada caso, e
    os passos como uma tabela com o veredito da última run; o `adfOfReport` os transforma no
    formato da Atlassian. A primeira publicação pergunta o espaço, uma página pai se houver e um
    título (`PublishModal`); o workspace guarda a página (`published`), e a publicação seguinte
    escreve a próxima versão dela, ou a faz de novo quando ela sumiu.
- **Um design do Figma é conferido contra a tela pelo Figma do próprio QA** (`role/chat/design.md`,
  `role/runner/design.md`). O `/figma` no chat recebe o link de um frame ou página
  (`designLinkOf`), e o workspace o guarda (`design`), que o cabeçalho dele abre no Figma:
  - Uma chamada num workspace com design lista o servidor do Figma ao lado do do QAzinho, sob o
    nome e o endereço com que o agente fez login (`FIGMA_MCP`, `mcpConfigWith`), então o Claude
    Code reusa o próprio login sob `--strict-mcp-config`. Ela recebe só as ferramentas que leem, e
    a sessão que o Figma pede primeiro (`DESIGN_TOOLS`, `designAccessOf`): sem ela, o Haiku não
    leu nada. O Codex lê a própria config de MCP, onde o QAzinho o adicionou.
  - O chat nomeia o arquivo e o nó (`describeDesign`), e o agente lê os frames enquanto planeja.
    Cada passo que cai numa tela desenhada nomeia o frame dela (`frame`), e o plano o abre no
    Figma (`frameUrlOf`).
  - Um caso cujos passos nomeiam frames recebe o servidor do Figma também, e a mensagem dele
    nomeia o arquivo e o frame de cada passo (`describeCase`). O agente lê o frame, mede a tela com
    `inspect`, e registra cada diferença com `bug` e o id do frame: um bug contra o design, cujo
    cartão abre o frame e cuja issue o linka. Um passo que falha no que espera nomeia o frame no
    `report` dele no lugar, então o bug dele é o do design, registrado uma vez.
  - O `inspect` responde na unidade que um design usa (`describeMeasure`): num navegador, a caixa
    onde a página fica, o espaço até os vizinhos (`gapsOf`) e a tipografia computada, as cores em
    hex (`hexOfColor`), o espaçamento, a borda e os cantos (`measureLocator`); no Android, a caixa
    em dp na densidade da tela (`densityOf`), no iOS em pontos (`phoneMeasureOf`), sem estilo.
  - Uma exploração recebe o servidor do Figma sempre que o workspace tem design, e a mensagem dela
    o nomeia (`describeExploration`): o explorador lê os frames uma vez, prende a cada tela o
    frame que a desenha, e sugere casos que nomeiam os frames dele (`role/explorer/design.md`).
  - O Estagiário liga ou desliga um design (`link_design`, `unlink_design`) e entrega a um chat um
    plano contra um (`figma` do `ask_workspace_chat`). Ele lê qual workspace tem design, o frame
    de cada passo e os bugs contra ele, e nunca lê o Figma em si.
  - O Figma conta cada leitura, e alguns assentos recebem só algumas por mês: a run lê um frame
    só nos casos que nomeiam um, e um caso andado de novo a partir da receita não confere design
    nenhum.
- **Um bug vai ao tracker do QA como uma issue**, e o QA não faz nada à mão além de colar uma tela
  no GitHub:
  - A página escreve o relatório no idioma do QA (`bugReportOf`): as palavras do agente, os
    passos com o que quebrou, o esperado e o que veio, os pedidos que falharam em volta
    (`failedRequestsNear`) e onde foi pego. Os blocos dele viram o formato de documento da
    Atlassian para o Jira (`adfOfReport`) e Markdown para o GitHub (`markdownOfReport`).
  - A página corta um clipe do momento do bug do MP4 da run (`clipOfMp4`), copiando os frames a
    partir do key frame anterior sem codificar, e o entrega à main inteiro, uma vez. O WebM de um
    celular vai inteiro pela main, abaixo de 25 MB. Uma tela cruza como o arquivo que a run
    guardou, lido só de dentro do arquivo.
  - O `BugFiler` da main o registra e conta cada passo (`IFilingEvent`). O `fileBug` do Jira usa o
    tipo Bug do projeto, senão o Task (`bugTypeOf`), depois cada arquivo é anexado e a issue
    relacionada à história. O do GitHub vai pelo `gh api`, com o rótulo bug onde ele existe.
  - A API do GitHub não aceita imagem, então o popup e o cartão do bug copiam a tela para a
    área de transferência como PNG (`copyShot`) para o QA colar.
  - O bug guarda a issue dele (`filed`), e o projeto guarda para onde foi o último bug dele
    (`issueTarget`), que é oferecido ao próximo (`issueTargetOf`). O `send_bug` do Estagiário
    espera antes um cartão de confirmação.
- **Um bug registrado e visto de novo chega à issue dele como um comentário** (`role/reporter/`),
  pesado pelo agente do QA e postado só pelo QA:
  - Quando uma run termina, na inicialização e quando um tracker conecta, o `useBugReviews` pega
    cada bug registrado com vistas de runs ainda não pesadas (`unreviewedOf`), um por vez, e só
    enquanto o tracker dele está conectado.
  - O `BugReviewer` da main lê a issue como está pelo `BugFiler.read` (status, texto,
    comentários) e pergunta ao agente com o bug e cada vista (`describeReview`), com as telas
    legíveis na pasta da run. Uma issue fechada é sempre uma regressão, e nunca é reaberta.
  - O agente responde `news`, `regression` ou `nothing-new` (`REVIEW_ANSWER`), com um comentário
    no idioma do QA para os dois primeiros. O bug guarda a revisão (`IBugReview`), e as runs dele
    contam como pesadas (`reviewedRuns`) assim que ele voltou, foi postado ou posto de lado.
  - O cartão a mostra (`BugUpdate`); o QA a edita e a posta, e o `BugFiler.comment` a escreve sob
    a issue (`updateReportOf`): no Jira com as telas novas e o clipe anexados, no GitHub pelo gh.
- **Os dispositivos e a biblioteca do passeio são o engine do harness**, o mesmo código com que o
  runner do CI anda um job: `WebDriver`, `AndroidDriver` e `IosDriver` com as bibliotecas deles, as
  receitas, provas e `variablePort` do passeio, e os auxiliares de processo (`spawnCommand`,
  `findOnPath`, `killTree`). A main os pega de `@salve-software/qazinho-harness/engine` e os
  barrels dela os reexportam, então uma correção num driver cai uma vez, para o desktop e o CI.
- **O harness nunca importa o desktop.** Ele vive no próprio repositório; o que ele precisa de um
  dispositivo é uma porta nos tipos dele (`IDevicePort`), e a main lhe entrega o driver. A página
  também nunca o importa: o que ele divide com a página vem por `src/shared/types`.
- **Todo formato que o agente preenche é um schema zod**: a resposta do chat e os argumentos de
  cada ferramenta. Ele vira o JSON Schema que o agente lê (`--json-schema`, ou a lista de
  ferramentas do MCP), e o mesmo schema lê de volta o que o agente mandou, com a mensagem que o
  agente recebe quando quebra uma regra. O `jsonSchemaOf` tira a chave `$schema`, que faz o Claude
  Code ignorar um schema em silêncio.
- **Um plano sai de uma conversa, nunca de um palpite** (`role/chat/planning.md`), do jeito que o
  harness da Ploomes constrói uma tela:
  - Olhar: antes de uma mensagem de chat num alvo web, o `AppPeek` abre o app e o agente lê o que
    a página dele mostrou. Num alvo Android ou iOS sem plano ainda, o `PhonePeek` abre o app no
    emulador ou simulador, sem janela, e o agente lê a primeira tela; o chat diz isso enquanto
    espera.
  - Perguntar (uma pergunta por vez na tela: uma opção responde e segue, "Outra" abre o campo):
    uma rodada de perguntas fechadas nas `questions` da resposta, cada uma com duas a
    quatro opções e as palavras do próprio QA sempre abertas. A página a desenha como
    `QuestionRound` e manda as respostas de volta como a mensagem seguinte.
  - Um segredo nunca é perguntado em palavras (`role/chat/variables.md`): uma opção cujas
    `variables` listam o que falta abre a janela dos valores, e a mensagem seguinte nomeia as
    variáveis guardadas, com as variáveis do projeto numa seção própria.
  - Confirmar: o plano prestes a ser escrito, com uma opção só.
  - Escrever: o `plan` só é preenchido depois que o QA escolheu essa opção.
- **Os prompts são fixados.** O `src/__tests__/__prompts__/` do harness guarda o que o agente lê
  para cada papel e plataforma; mudar o que o agente ouve é um diff desses arquivos, no
  repositório do harness.

## QAzinho Pro, fora do caminho do QA

Entrar no QAzinho Pro não muda nada em como o app é usado, e não manda nada: um projeto só vai a
uma org quando o QA o publica, do jeito que o GitHub Desktop publica um repositório
([030](https://github.com/Salve-Software/qazinho-server/blob/main/docs/adrs/030-the-desktop-publishes-and-clones-projects.md)).
O cartão no pé da sidebar (`ProAccountCard`), a seção Org da janela do projeto (`ProjectProPane`)
e uma marca em cada projeto ligado na sidebar são onde ele aparece.

- **Entrar** é o device flow da plataforma (`ProAccount`): um código que o QA confirma no
  navegador, o token lacrado com o `safeStorage` em `pro.bin`, como o do Jira. A conta conhece as
  orgs dela; nenhuma org é da máquina, cada projeto nomeia a sua.
- **Um projeto é local ou ligado a uma org.** Publicar (`ProSync.publish`) o liga a uma org que o
  QA escreve e o manda inteiro, depois de a janela dizer o que vai (`ProSync.brief`): os planos,
  runs e bugs dele, e quanto pesa a mídia do histórico dele, que fica aqui a menos que o QA a
  mande também (`mediaFrom`: uma run ou um bug anterior vai sem as telas e o vídeo). Clonar
  (`ProCloneModal`, `ProDownloads`) traz um projeto de uma org para cá, ligado a ela. Um projeto
  vai a uma segunda org só como cópia (`copiedProjectOf`), um projeto novo com ids próprios.
- **Os fatos vão sozinhos, os planos quando mandados.** A página monta o que um projeto ligado
  guarda (`proBatchOf`) e o entrega à main quando uma rajada acalma (`useProSync`); a main manda o
  projeto, as runs, os bugs e as gravações dele (`ProSync.push`), e guarda cada plano editado aqui
  como pendente (`pendingPlansOf`) até o QA mandá-los (`ProSync.sendPlans`), cada um a próxima
  versão da org, então um rascunho nunca é o que o CI roda. O relógio de uma run viva não é
  mudança (`changedProjectsOf`).
- **A main manda só o que mudou** (`ProSync`): cada parte com a chave de um hash em
  `pro-sync.json` (um plano tirado da org é identificado no push seguinte enquanto os casos dele
  são os que veio com, `healedPlansOf`), telas e vídeos transmitidos só de dentro do arquivo
  (`isInside`, `uploaderOf`), um minuto de espera quando a rede cai. Um build vai pelo nome do
  arquivo e um endereço web sem login dentro (`sharedValueOf`); as variáveis vão pelo nome. Uma
  escrita depois da primeira do projeto diz que não pode criá-lo (`canCreate: false`), então um
  projeto apagado na org recebe `gone` e nunca é trazido de volta.
- **As mudanças da org são buscadas, não aplicadas.** A main pergunta a cada org de um projeto
  ligado na inicialização, depois de um login e a cada cinco minutos (`ProSync.pull`), e guarda
  cada plano que a org mexeu além do que este computador pegou (`movedPlansOf`), ou um que um
  envio achou mexido (`plan_conflict`), como uma atualização esperando. O QA as toma com
  "Atualizar da org" (`useProUpdate`): juntadas caso a caso a partir de onde os dois começaram
  (`planUpdatesOf`, `mergeCases`); só um caso que os dois lados mudaram abre o `ProMergeModal`,
  onde o QA mantém um lado. A main então constrói sobre a versão da org (`ProSync.resolve`).
  Rodar um plano com uma atualização esperando pergunta antes (`ProRunWarning`).
- **Deixando um vínculo.** Desligar (`ProSync.forget`) mantém o projeto aqui e o que a org guarda
  lá. Apagar um projeto aqui o desliga, e um dono ou admin pode apagá-lo na org também
  (`ProSync.remove`), recusado enquanto um job de CI dele roda. Um projeto que a org não tem mais
  recebe `gone`, uma org que a pessoa não alcança mais `no-access`: a janela oferece publicá-lo de
  novo ou desligá-lo.
- **O cartão** lê em que pé as coisas estão (`attentionOf`): uma org bloqueada, um papel que só
  lê, um projeto sumido, nenhuma resposta. Ele lista as orgs da conta e abre o `ProCloneModal`,
  que busca os projetos de uma org e clona um (`useOrgDownload`): as gravações dele no
  `recipes.json` de cada workspace, e os valores das variáveis dele pedidos no `VariablesModal`.
- **O link de um plano na web o abre aqui** (`qazinho://open?org=…&project=…&workspace=…`, pelos
  ids com que o desktop os guarda). Os instaladores registram o esquema, e um app empacotado de
  novo na inicialização. A main lê o link do `open-url` num Mac, e dos argumentos da primeira ou
  segunda instância no Windows e no Linux (`proLinkAddressIn`, `proLinkOf`, que toma só nomes como
  ids), guarda o último e avisa a página, que o pega assim que os workspaces dela são lidos
  (`useProLinks`): ela abre o workspace no plano dele, ou o `ProLinkModal` oferece baixar o
  projeto da org (`useOrgDownload`, que o cartão também usa), ou diz por que não pode.

## A ilha do notch

Uma terceira página, a `island.html`, é a janela da ilha: transparente, sem moldura, sempre por
cima e visível em todos os espaços (`ISLAND_ARGUMENT` no mesmo preload entrega `window.qazinhoIsland`).

- A página principal diz o que mostrar (`useIslandSync`, `islandStateOf`): toda pergunta esperando
  o QA, da mais antiga à mais nova, vem antes de uma run andando, e o fim de uma run fica oito
  segundos (`ISLAND.endedHoldMs`). Ela manda o estado só quando muda, com o idioma do QA, pelo
  `Island` de `src/services/`.
- A `Island` da main põe a janela no centro do topo da tela primária (`islandPlaceOf`): a altura
  da barra de menus é a do notch num Mac que tem um (30 pt ou mais), com a largura fixa dele
  (`ISLAND_WINDOW.notchWidth`), e uma barra de 28 pt sem largura em qualquer outra tela.
- Num Mac a janela é um painel (`islandBehaviorOf`), que flutua sobre um app em tela cheia e recebe
  teclado sem ativar o app. O `setVisibleOnAllWorkspaces` vai com `skipTransformProcessType`: sem
  ele, o Electron esconde o app do Dock, e a contagem de runs no ícone com ele.
- A janela deixa o clique passar. A página mede o mouse contra o pill e só então pede à main que
  a deixe receber cliques (`hover`). A ilha só abre com o mouse em cima, ou enquanto o QA digita,
  nem por uma pergunta do agente: ela chama sem se impor, e a altura aberta é a do conteúdo.
- O QA responde na própria ilha (`useIslandAsk`, `IslandAsk`). A resposta (`IslandAction`) vai da
  janela à main e dali direto a `RunCoordinator.answer`, como a do cartão do chat, e volta à página
  como `answered`. As palavras são sempre `said`: uma pergunta secreta não tem campo na ilha, e o
  botão dela abre o app, o único lugar que digita um segredo.
- A janela só pega o teclado quando o QA aperta o campo (`keyboard`), e o devolve ao sair dele, com
  Esc ou ao responder, um instante depois para não engolir o clique que tirou o foco
  (`ISLAND_WINDOW.keyboardReleaseMs`). O rascunho de cada pergunta fica até ela ser respondida.
- Parar ou abrir volta pela main à página principal, que executa pelas mesmas actions de uma run
  (`stopWorkspace`) ou abrindo o workspace; a main traz a janela do app à frente só para abrir.
- A ilha não é uma janela do app (`appWindows` a deixa de fora), e o preto dela é o do notch
  (`--notch-black`): nada é desenhado sobre o recorte, só em volta e abaixo dele.

## Um agente de fora

O agente que o QA usa no próprio editor alcança o QAzinho por dois servidores, num cartão só
(`OutsideServerCard`): o local, descrito aqui, e o da plataforma (`OrgServerRow`), que só aparece com a
conta logada e entra pelo fluxo de MCP de sempre (`MCP_CATALOG.org`, `useMcpCardViewModel`). Eles
continuam dois porque o da plataforma precisa funcionar com o app fechado, e o local só existe nesta
máquina. O da plataforma gasta os créditos da org, então toda chamada do QAzinho o deixa de fora:
`--disallowedTools` no Claude Code, `enabled=false` no Codex (`AGENT_RUN.orgServer`).

O local é desligado até o QA ligá-lo. É o caminho inverso do resto do app: aqui quem inicia é o agente.

- O `OutsideServer` da main guarda a porta e o token em `outside-server.json` (0600) e sempre volta ao
  mesmo endereço, que o agente do QA guarda. Uma porta ocupada não derruba o app: o cartão oferece
  outra, e o `renew` leva o endereço novo aos agentes que guardavam o anterior.
- **O endereço nunca chega à página.** Ela pede à main para adicioná-lo a um agente (`AgentMcp.addAddress`)
  ou copiá-lo; só a main o lê. Um `Origin` ou um `Host` de fora da máquina é recusado (`isLocalRequest`).
- As sete ferramentas vivem no harness (`servers/outside/`, `OutsideHost`), e a resposta a uma chamada
  (`OutsideToolCall`) vem da página, pelas mesmas stores e actions dos cliques do QA
  (`performOutsideTool`), numa ponte só dela: a do Estagiário solta o que espera a cada turno dele. Com
  a janela fechada, a main a abre e pede ao agente que chame de novo.
- **Uma run não inicia outra.** O servidor é adicionado sob o nome `qazinho`, o mesmo do servidor
  interno, então toda chamada que o QAzinho faz ao agente o sobrepõe, com ou sem `--strict-mcp-config`
  (conferido contra o Claude Code real). O `start_run` anda pelas gravações por padrão, sem IA; o agente
  só entra com `withAgent`, ou num caso sem gravação, e a descrição da ferramenta diz o custo.
- Um `run_status` com `waitSeconds` segura na página até a run acabar ou o agente da run precisar do QA,
  por no máximo 50 segundos, abaixo do tempo limite dos clientes de MCP. As chamadas não entram em fila:
  um `stop_run` passa enquanto outra espera.
- Tudo o que uma ferramenta responde veio do app testado, e o agente de fora tem shell e o código do
  QA. A descrição de cada uma diz que é dado, e um valor de variável nunca passa: as runs já os guardam
  como `${NAME}`, e nenhuma ferramenta lê o `VariableVault`.
- Um caso sugerido (`suggest_cases`) fica num cartão no chat (`ISuggestionMessage.from`), e só o QA o
  leva ao plano (`takeSuggestion`).

## O trabalho pesado fica fora do processo main

Agentes, o Playwright e os drivers de dispositivo vão rodar em processos filhos
(`utilityProcess`), para um emulador lento nunca congelar uma janela. **Os frames de vídeo nunca
cruzam o IPC**: o Chrome roda sem janela, e o screencast do CDP dele chega à página como MJPEG em
loopback (`LiveStream`), desenhado por um `<img>`.

- O Chrome renderiza na razão de pixels do QA, limitada a 2, e a janela dele é dimensionada em
  volta do viewport (`Browser.setContentsSize`), ou um frame corta o pé da página.
- O stream roda a 1x no painel, e na razão de pixels só enquanto o dispositivo está em foco
  (`focusDevice`): um frame 2x custa cerca de três vezes a CPU numa página que anima.
- O Chrome mantém uma janela com pelo menos 500px de largura, então uma página do tamanho de um
  celular transmite enquadrada mais larga, e o `DeviceScreen` corta o stream no formato do
  viewport.
- Um celular também não tem janela: o emulador sobe com `-no-window` (`bootArgs`) e um simulador
  pelo `simctl`, sem o Simulator.app. O QA o vê só na aba Dispositivo do painel.

**Toda run é gravada, e o vídeo dela também nunca cruza o IPC.**

- Um navegador é gravado a partir do stream vivo dele. O `RunRecorder` abre uma janela escondida,
  cujo serviço `Recorder` lê o mesmo MJPEG em loopback, cada frame carimbado com quando foi
  capturado e o formato da tela. Ele corta uma página do tamanho de um celular do jeito que o
  `DeviceScreen` faz, codifica H.264 com WebCodecs, e devolve o MP4 em pedaços que a main escreve
  por posição.
- Um celular se grava sozinho: um simulador com `simctl io recordVideo`, um emulador com o
  `screenrecord` do console dele, como WebM, por até a meia hora que ele permite. Ele para antes
  de o dispositivo fechar.
- O `ReplayServer` serve o arquivo ao `<video>` da página em loopback, nos intervalos de bytes que
  um vídeo pede para buscar. A CSP deixa entrar mídia de loopback, e nada mais.
- A main carimba cada passo e achado com o momento em que o ouviu, então a linha do tempo da run
  põe cada caso, passo e bug no vídeo (`replayTimelineOf`).
- **As janelas do próprio app deixam o gravador de fora** (`appWindows`): um broadcast, um diálogo
  ou o clique no dock nunca cai nele.
- **Os pedidos de um navegador são guardados ao lado do vídeo dele** (`network.json`). O
  `WebDriver` anota cada um que o Chrome faz, e o `privateUrlOf` escreve o valor de uma variável no
  endereço dele como o nome dela e um valor de query com cara de segredo como pontos antes de ser
  guardado. Um celular ainda não guarda nenhum.
- **O agente lê as chamadas de API** (fetch e XHR). O `WebDriver` guarda as últimas respostas
  (`apiCalls`, `responseBody`) e o começo do que uma chamada que falhou respondeu (`body`). A porta
  da run (`variablePort`) conta as chamadas que falharam durante cada ação (`failedCalls`) e
  responde `network` (`calls`): o `callLineOf` escreve uma chamada, e o `maskedBody` põe chaves e
  tokens com cara de segredo como pontos antes de o `hiddenValues` nomear cada variável. O `body`
  guardado é mascarado do mesmo jeito, e o relatório de um bug o carrega sob o pedido dele
  (`answer`).
- A página os desenha sob o vídeo (`ReplayNetwork`), e refaz o vídeo para baixar com eles
  desenhados: o `ReplayComposer` lê o MP4 da run (`readMp4`), o decodifica com WebCodecs, desenha a
  faixa em cada frame (`drawNetworkStrip`), segura a imagem enquanto a tela ficou parada, e
  codifica um MP4. O arquivo cruza o IPC inteiro, uma vez para cada lado (`replayVideo`,
  `saveVideo`); os frames dele nunca.

## Os testes que o time já tem viram um plano

O `/import` do chat, que o chat vazio também oferece, escolhe uma
pasta de testes do QA. O QAzinho a lê e não muda nada nela:

- A main abre o seletor de pasta (`pickImport`) e o `ImportScanner` lista os arquivos sem as
  pastas de dependência e de build (`listFolder`), e reconhece o que dirige os testes
  (`recognizeTests`): a config, os pacotes dos manifestos (`readManifests`) e os arquivos de teste
  de cada framework (`IMPORT_FRAMEWORKS`), com os fluxos do Maestro achados pelo `appId:` do começo
  de cada YAML (`flowsIn`). Cada arquivo de teste é de um framework só. A branch e o commit vêm do
  `GitCli`, quando a pasta é um repositório.
- Só uma pasta que o QA escolheu por ali pode ser lida de novo (`sourceOf`): o `IAskAgent.source`
  carrega só o caminho, e a main recusa um que ninguém escolheu (`ChatFailure` `import`).
- A mensagem abre com a pasta (`describeImport`): onde está, o que o QAzinho reconheceu e os
  arquivos que parecem testes. O Claude Code recebe `Read`, `Grep` e `Glob` só nessa pasta, e o
  Codex a lê com o próprio sandbox somente leitura. Nada é copiado, então nada é apagado.
- A janela de um projeto novo também oferece a pasta (`ImportField`): ela é guardada ao criar o
  projeto (`pendingImport`) e o primeiro chat desse projeto abre o `/import` já nela, uma vez
  (`startWith`), sem abrir o seletor de novo. Um projeto que já existe importa pelo chat.
- A pasta fica aberta ao chat do workspace até um plano voltar, nas perguntas que vêm entre uma
  mensagem e outra (`importSources`), e é solta com o plano ou com o workspace.
- O plano sai de uma conversa, como em qualquer outra fonte: o agente confirma o framework,
  pergunta o que o teste deixa em aberto, e escreve os casos (`role/chat/import.md`).

## O que a main possui

Além do `Harness` e do `McpHost` do harness, que a main constrói e liga:

| Classe                                | O que faz                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `AgentDetector`                       | acha as CLIs de agente do QA, do jeito do Orca: sondas no fs, sem subprocesso                               |
| `AgentRunner`                         | inicia o Claude Code ou o Codex, cada um no dialeto dele, e lê a resposta de volta                          |
| `WebDriver`                           | dirige o Chrome pelo playwright-core, um perfil por workspace                                               |
| `LiveStream`                          | serve os frames do dispositivo como MJPEG em 127.0.0.1, para a aba Dispositivo                              |
| `AppPeek`                             | abre um alvo web por um instante antes do chat, e lê o que a página dele mostra                             |
| `PhonePeek`                           | abre um app de celular no emulador ou simulador antes de um plano, e lê a primeira tela                     |
| `RunCoordinator`                      | anda um plano um caso por turno de agente, cada um com o app aberto de novo, ou pela receita                |
| `CodeExport`                          | escreve os casos gravados como código Playwright ou Maestro, numa pasta que o QA escolhe                    |
| `ResourceCollector` / `ProcessOwners` | uma varredura de processos (`ps`, ou `WindowsProcesses`), cobrada de quem a iniciou                         |
| `Archive`                             | os projetos, workspaces e planos do QA em disco, cada um escrito inteiro; um plano quebrado de lado         |
| `SetupInstaller`                      | instala uma CLI de agente, o idb ou o gh a pedido, transmitindo cada linha que imprime                      |
| `IntegrationVault`                    | conecta os trackers: o GitHub como a conta do gh, o token do Jira lacrado pelo `safeStorage`                |
| `ConfluenceApi`                       | lê e publica páginas do Confluence no site do Jira, com o token do Jira                                     |
| `AgentTerminal`                       | roda a interface de tela cheia de um agente fora de vista: a lê, aperta as teclas dela                      |
| `AgentMcp`                            | adiciona um servidor MCP ao agente do QA e faz o login nele, passo a passo                                  |
| `AgentLogin`                          | abre o login próprio do agente do QA num terminal visível e espera o status dele dizer que entrou           |
| `LinkCatcher`                         | entrega a um agente um `$BROWSER` que anota as páginas que ele quer abertas                                 |
| `RunRecorder`                         | grava o stream vivo de uma run num MP4, pela janela escondida do gravador                                   |
| `ReplayServer`                        | serve a gravação de uma run ao `<video>` da página em 127.0.0.1, com intervalos de bytes                    |
| `StorageKeeper`                       | o que o QAzinho guarda neste computador, por tipo, e os vídeos de run que ele solta depois de velhos        |
| `RunAlerts`                           | chama o QA de volta quando uma run termina ou lhe pergunta algo: uma notificação, um badge                  |
| `OutsideServer`                       | abre a porta do QAzinho ao agente que o QA usa no editor, num endereço estável                              |
| `Island`                              | a janela transparente do topo da tela que veste o notch e mostra a run, pelo `IIslandFrame`                 |
| `GithubCli`                           | fala com o GitHub pelo gh do próprio QA: status, login por device flow, API, tar                            |
| `GithubRepos`                         | lista os repositórios do QA e as branches de um repositório, guardados por um tempo                         |
| `CodeCopies`                          | copia uma branch para o agente ler enquanto planeja, com o diff, e depois a apaga                           |
| `JiraApi`                             | fala com o Jira Cloud do QA com o token lacrado para ele: busca, história, arquivos, bugs                   |
| `BugFiler`                            | registra um bug no tracker do QA: uma issue do Jira com os arquivos, ou uma do GitHub pelo gh               |
| `BugReviewer`                         | pergunta ao agente do QA se um bug registrado e visto de novo acrescenta algo à issue dele, como está agora |
| `JiraStories`                         | lê uma história do Jira para o agente planejar, com os arquivos que ele consegue ler, e depois a apaga      |
| `AssistantAgent`                      | pergunta ao agente do QA como o Estagiário, com as ferramentas do app servidas pelo turno                   |
| `AppBridge`                           | entrega cada chamada de ferramenta do app à página e espera o que ela fez                                   |
| `AppBuilder`                          | constrói um .apk ou .app a partir de uma branch com o agente do QA, e guarda o que fez                      |
| `UsageReader`                         | lê os limites da conta pelo `/usage` do próprio Claude Code, que não gasta nada                             |
| `VariableVault`                       | guarda as variáveis de cada projeto lacradas pelo keychain; só uma run lê um valor                          |
| `GitCli`                              | roda o git do próprio QA numa pasta, e nunca espera uma senha                                               |
| `ImportScanner`                       | lê uma pasta de testes que o QA escolheu e reconhece o framework de cada um                                 |
| `ProAccount`                          | faz este computador entrar no QAzinho Pro, guarda o token lacrado dele, e conhece as orgs                   |
| `ProApi`                              | fala com a API do QAzinho Pro: o login, a conta, a sincronização, as evidências, projetos de org            |
| `ProSync`                             | publica um projeto numa org, manda os fatos dele quando acontecem e os planos quando mandado                |
| `ProDownloads`                        | lista os projetos da org e baixa um, as gravações incluídas                                                 |

## Dependências

- As `dependencies` vão dentro do app e as `devDependencies` não. Tudo o que a página usa, o React
  incluído, é empacotado pelo Vite, então é uma devDependency.
- Uma dependência de runtime em `src/main` vai para todo usuário: hoje o `playwright-core` dirige o
  alvo web, o `yaml` escreve os planos, o `@modelcontextprotocol/sdk` serve as ferramentas do
  dispositivo, e o `zod` dá formato às respostas (o SDK do MCP o traz de qualquer jeito). Pense
  duas vezes antes de uma quinta.
