# Plataformas

O QAzinho roda no **Windows, no Linux e no macOS**, e toda mudança o mantém rodando nos três. Um
QA no Windows recebe o mesmo app que um num Mac. Só o que o próprio SO proíbe é diferente: os
simuladores de iOS só existem num Mac, então o alvo iOS e o idb vivem só lá.

## Iniciando um comando

- **Todo processo filho começa por `spawnCommand` ou `execCommand`** (o engine do harness,
  reexportado por `src/main/library`), nunca por `spawn` ou `execFile` direto. No Windows eles
  fazem três coisas:
  - Um shim `.cmd` do npm roda como o script ou o `.exe` para o qual aponta (`launchOf`). O Node
    se recusa a iniciar um `.cmd` sem um shell, e o cmd.exe estraga um argumento JSON.
  - Nenhuma janela de console pisca na tela (`windowsHide`).
  - O filho recebe um PATH só (`envWithOnePath`). O Windows chama o dele de `Path`, e um `PATH`
    definido ao lado dele precisa ser o lido.
- **Um comando é achado com `findOnPath` sobre `machineDirectories()`**, o único lugar onde a main
  procura comandos:
  - O PATH é dividido pelo separador da própria plataforma.
  - No Windows um comando é achado pelo `.exe` antes do `.cmd`, e nunca como o script sh sem
    extensão que o npm escreve ao lado deles.
  - `searchDirectories` soma onde cada plataforma instala as coisas: Homebrew e `~/.local/bin`;
    `/snap/bin`; `%APPDATA%\npm`, `Program Files\nodejs`, `Git\cmd`, `GitHub CLI` e os links do
    winget.
- **Uma árvore de processos termina por `killTree`.** No Mac ou no Linux ele sinaliza o grupo do
  processo. No Windows, que não tem sinais, `taskkill /T /F` termina a árvore, então um `SIGINT`
  gentil é uma parada dura lá.
- **Nada que roda em todo lugar nomeia uma ferramenta POSIX**: nada de `/bin/sh`, `/usr/bin/…`,
  `ps`, `which` ou `brew` sozinhos. Uma ferramenta que uma plataforma não tem é protegida por
  `process.platform`, com o que as outras fazem no lugar:

  | Necessidade                   | Mac                   | Linux                                     | Windows                                           |
  | ----------------------------- | --------------------- | ----------------------------------------- | ------------------------------------------------- |
  | todo processo, para Recursos  | `ps`                  | `ps`                                      | um PowerShell mantido aberto (`WindowsProcesses`) |
  | instalar o gh                 | Homebrew              | Homebrew                                  | winget                                            |
  | um terminal que o QA vê       | um arquivo `.command` | o terminal do desktop (`linuxTerminalOf`) | um arquivo `.cmd`                                 |
  | o terminal escondido (`/mcp`) | `expect`              | `expect`, quando instalado                | nenhum: o terminal visível                        |
  | pegar o navegador do agente   | um `$BROWSER` sh      | um `$BROWSER` sh                          | nenhum: o agente abre a página dele               |
  | o JDK do Android Studio       | dentro do .app        | `/opt`, `~`, snap                         | `Program Files\Android`                           |

## Caminhos

- Monte um caminho com `path.join`. Um caminho que veio do git, do Playwright ou de uma ferramenta
  se compara com qualquer das barras (`[\\/]`), e um caminho que a página guarda (o arquivo de um
  teste) é escrito com `/`.
- Um symlink exige um administrador no Windows: uma pasta é ligada como junction, um arquivo é
  copiado.
- Um binário do SDK (`adb`, `emulator`, `aapt2`) é iniciado pelo caminho dele sem extensão, que o
  Windows completa com `.exe`. Uma checagem de que o arquivo existe não pode esquecer a extensão.

## Janela e teclado

- O Mac mantém os semáforos dele (`hiddenInset`). O Windows e o Linux ganham controles próprios
  sobre a barra de título (`titleBarOverlay`), pintados a partir do tema na tela
  (`paintWindowControls`), e a barra de título deixa espaço para eles (`titlebar--overlay`).
- Um atalho é guardado com ⌘ e ⌥, e o Ctrl aperta o que o ⌘ faz. A página o mostra do jeito que o
  teclado o nomeia (`comboLabelOf`): Ctrl e Alt fora do Mac.
- O Windows mostra as notificações sob o nome do próprio app (`setAppUserModelId`).
- Um QAzinho roda por pasta de dados (`requestSingleInstanceLock`). O Dock mantém um Mac em um
  só, mas o Windows e o Linux iniciam um segundo app a cada abertura; ele sai e traz a janela
  aberta para a frente.

## Atualizando o app

O `electron-updater` atualiza os três, cada um do jeito dele:

| Sistema | O que baixa       | Só o que mudou      | Assinatura                                                |
| ------- | ----------------- | ------------------- | --------------------------------------------------------- |
| Mac     | um `.zip`         | a partir da segunda | obrigatória: o Squirrel recusa um app sem assinatura      |
| Windows | o instalador NSIS | desde a primeira    | ainda nenhuma: sem `publisherName`, vale o sha512 do feed |
| Linux   | o AppImage        | desde a primeira    | nenhuma; só atualiza quem roda o AppImage (`canUpdateOf`) |

No Mac a primeira atualização vem inteira, porque o `update.zip` de que o download parcial parte só
existe depois dela. O Windows ganha um `publisherName` assim que houver um certificado, e uma versão
sem assinatura ainda instala a primeira com assinatura.

## Provando

- Uma library que difere por plataforma recebe `platform` como parâmetro, e o teste dela cobre
  `win32`, `linux` e `darwin`. Os caminhos do Windows são testados como strings: `C:\Users\…`.
- O CI roda só no Linux, e nenhuma máquina Windows andou pelo app ainda. Até que uma ande, um
  caminho do Windows é provado pelo teste unitário dele, e uma mudança que toca processos ou
  caminhos diz em quais plataformas raciocinou.
