# QAzinho

Um assistente de QA desktop, local-first. Um profissional de QA planeja testes, os roda em apps
web e mobile, e mantém o trabalho de teste dele organizado, com o próprio agente de IA ao lado: o
agente rascunha o plano com ele, anda os fluxos num dispositivo real e relata o que viu contra o
que o QA esperava. O QA continua no comando; o agente é o assistente.

| Alvo    | Entrada                                     | Dirigido por                                      | Verificado       |
| ------- | ------------------------------------------- | ------------------------------------------------- | ---------------- |
| web     | a URL do ambiente                           | Playwright sobre o próprio Chrome do QA           | de ponta a ponta |
| Android | um `.apk`                                   | o próprio AVD do QA, pelo `adb` e o `uiautomator` | de ponta a ponta |
| iOS     | um build `.app` de simulador, não um `.ipa` | `simctl` sobe e fotografa; `idb` lê e toca        | de ponta a ponta |

O QAzinho acha o SDK, o emulador e o idb onde eles já estão, e nomeia o que falta onde o QA lê.
**Ele instala só o que é leve, e só quando o QA pede**: as CLIs de agente pelo npm, e o idb como o
companheiro do Homebrew mais o cliente Python dele num virtualenv próprio (o simctl não tem
comando que toque a tela). O SDK do Android e o Xcode são grandes demais: a configuração da
primeira execução os linka e confere de novo.

Feito para times técnicos de QA, e para QAs que estão indo do manual ao técnico. Um projeto é um
ambiente com um ou mais alvos. Os workspaces guardam um plano de testes, e vários rodam em
paralelo.

**É calmo e plano para trabalhar o dia todo** (`rules/sticker-design.md`): o trabalho fica numa
superfície Night ou Paper, cartões e popups são elevados só por uma linha de 1px e, quando
flutuam, uma sombra suave, e nada se inclina nem se cola na tela. A marca vive em poucos toques: o
acento lima, o Estagiário desenhado plano, o Bricolage nos títulos, e o logo, que sozinho continua
um sticker. Toda tela o segue.

## As regras que não estão em negociação

1. **Tudo roda na máquina do usuário.** Emuladores, simuladores, navegadores e runs. O app grátis
   nunca precisa de um backend do QAzinho; só a hospedagem de times do Pro usa um.
2. **O agente é do usuário.** Claude Code ou Codex por enquanto, dirigidos pelas CLIs deles; mais
   agentes virão, um de cada vez, cada um conferido contra a CLI real antes de ser oferecido. O
   QAzinho constrói o harness de QA em volta dele e nunca guarda uma chave de provedor nem um
   login próprio. Quando o agente está sem login, o QAzinho abre o login do próprio agente
   (`claude auth login`, `codex login`) num terminal que o QA vê, como o Zed faz: a página abre
   no navegador do QA, o agente guarda o que recebe, e o QAzinho só lê o status dele.
3. **Um produto da Salve Software, código fechado, em dois planos.** O Free é o app desktop
   inteiro, sem conta e sem limite artificial: baixe e use. O Pro é uma plataforma web paga para
   uma empresa: uma conta e uma org, onde o QA publica os projetos da máquina dele que escolhe,
   uma org cada, para compartilhar projetos, planos e runs. O app desktop nunca precisa do Pro e
   nada local é moldado em torno dele. Hoje o trabalho é o app desktop; a plataforma vem depois
   (`ROADMAP.md`).
4. **A página é uma página web e nada mais.** Sem Node, sem Electron, sem sistema de arquivos. Ela
   pergunta ao processo main por `window.qazinho`, cujo contrato vive em `src/shared/types/`.
5. **Nada na interface é um mock.** Todo número, screenshot e veredito na tela voltou da máquina.
   Quando algo ainda não foi construído, ele diz isso onde um QA pode ler.
6. **Roda no Windows, no Linux e no macOS.** Toda funcionalidade funciona nos três, fora o alvo
   iOS, que só um Mac roda (`rules/platforms.md`). Um comando, caminho, janela ou atalho que
   presume um SO é um bug.
7. **O código é em inglês, a prosa em português.** Nomes, strings, nomes de testes e commits ficam
   em inglês. Os `.md` (o corpus do harness incluído), o JSDoc e os comentários dos testes são em
   português do Brasil.

## Estado

**O alvo web funciona de ponta a ponta.** Um QA faz um projeto e um workspace, conversa com o
próprio agente, recebe um plano, o roda e vê o Chrome real ser dirigido passo a passo. O plano sai
de uma conversa: o agente anda pelo app no navegador do QAzinho, que o QA acompanha na aba
Dispositivo, conversa sobre o que diverge do que ele esperava, faz uma rodada de perguntas no chat,
e confirma o que vai escrever antes de escrever. Um Claude Code real (Haiku) andou assim o painel de
uma loja fake por meio centavo (`tests/smoke/learn.test.ts`): entrou com as variáveis, não salvou
nada e disse onde as palavras do app discordavam das do QA. Um controle com test id (`data-testid` e
parecidos) é nomeado e alvejado por ele, que segura quando as palavras mudam; num celular ainda não.
Um app num iframe, de outro site ou dentro de outro iframe, é lido e alcançado como o resto da
página, e as chamadas dele entram na rede da run (`tests/smoke/frames.test.ts`); um agente real
ainda não andou um. Na run, o agente lê a página, age, a run tira um screenshot, e o agente julga o
que vê contra o que o QA esperava. Um passo que falha vira um bug com a evidência dele. Um bug que
volta não é registrado duas vezes: os agentes de cada run ouvem os bugs abertos e nomeiam um visto
de novo, um passo de plano que falha de novo cai no bug dele, e a aba Bugs conta as runs que o
viram, com cada tela; um agente fake andando um plano duas vezes deixou um bug por problema, cada um
visto em duas runs. Tudo é guardado em disco, uma pasta por workspace, com o plano ao lado em YAML,
cada arquivo escrito inteiro. Um plan.yaml quebrado à mão é posto de lado, nunca sobrescrito: a aba
Plano diz em qual linha, mostra o arquivo e o lê de novo depois de consertado.

O `npm run test:smoke` prova isso: ele dirige o navegador real com o agente real.

**O Android funciona do mesmo jeito**, provado pelo `tests/smoke/android.test.ts`: ele instala um
contador de visitas construído do fonte no AVD do próprio QA, lê a tela do `uiautomator`, toca o
que o agente nomeou, e julga o que vê.

**O iOS funciona do mesmo jeito**, provado pelo `tests/smoke/ios.test.ts`: um contador de visitas
construído do fonte para o simulador (`tests/smoke/fixtures/`), lido e tocado pelo idb, e um plano
andado e julgado pelo agente do próprio QA. Todo caso começa com o app aberto de novo: o Android
limpa os dados dele, o iOS o reinstala, a web limpa o navegador (`device-fresh.test.ts`,
`fresh.test.ts`). Um passo que fecha o app e o abre de novo faz isso de verdade com `reopen`, com
os dados mantidos: o Android para o app, o iOS o termina, a web abre o endereço dele numa aba nova.
O runner também rola até palavras aparecerem, segura um dedo e arrasta uma coisa sobre outra, e na
web passa o mouse e envia um arquivo de exemplo que o QAzinho fez. Num celular ele rola antes de
dizer que algo falta. O navegador e os dois apps de fixture provam a rolagem e o toque longo
(`tools.test.ts`, `device-fresh.test.ts`); um arrasto num celular ainda não encontrou um app real.
Antes de um plano num celular, o chat abre o app no emulador ou simulador e lê a primeira tela
dele. Um app iOS que não adota o UIScene não abre no iOS 27, e o QAzinho diz que ele fechou na
hora.

**O chat escreve enquanto o agente escreve, e a run diz o que está fazendo.** A resposta do agente
chega em pedaços, mesmo a que vem em JSON, e cada ferramenta que ele chama vira uma linha curta
no chat ("Comparando Título com o Figma"), nas palavras do QA e sem gastar token. Quando um bug é
pego, a tela do dispositivo pisca como uma foto, a imagem encolhe sobre o fundo desfocado, chega
perto do que está errado com a mira travada nele, quando o bug é sobre uma coisa só, e o tipo do bug e o título dele ficam ali alguns
segundos; mais curto e mais suave depois dos dois primeiros da run. O `tests/smoke/caught.test.ts` prova os três no app
construído com um agente fake. Um Claude Code real (Haiku) andou uma loja com bugs plantados: a
resposta chegou em pedaços, as linhas seguiram cada ação, e ele apontou o elemento nos três bugs
da última volta;
pelo Codex a resposta ainda chega inteira e nenhuma run foi tentada.

**Um plano tem três etapas, e cada uma aparece.** Escrever o plano, desenvolver (o agente anda cada caso uma vez e grava o teste) e rodar (a gravação anda sozinha). A aba Plano mostra em qual o plano está, cada caso desenvolvido leva a marca dele, o botão principal diz "Desenvolver plano", "Desenvolver 3 casos" ou "Rodar plano" conforme o que falta, e a run diz "desenvolvendo", "rodando" ou "ajustando" em todo lugar. Um caso que não passou inteiro continua por desenvolver. Enquanto a run anda, a aba Plano mostra em qual caso ela está e como cada um foi.

**O QA fala com a run enquanto ela anda.** O composer continua aberto durante a run: o que o QA escreve chega ao agente junto da resposta da próxima ferramenta, ele para o plano, confere e responde no chat. Numa gravação, sem agente, o agente assume o caso de onde o app está. O que nenhum agente chegou a ler vai para o chat quando a run acaba. O agente também conta por que faz o que o passo não nomeia (`say`), e pergunta (`ask_qa`) quando não acha o caminho: a run lembra disso a ele num passo que não anda. Um Claude Code real (Haiku) explicou o preparo de um caso, conferiu o que o QA disse e respondeu no chat, e perguntou onde ficava uma tela que não achou; o `tests/smoke/together.test.ts` prova o resto no app construído com um agente fake.

**Uma run web abre mais de uma tela.** Um caso de duas pessoas ao mesmo tempo abre outra aba, ou um navegador limpo para outra conta (`tab`). Com mais de uma tela, o dispositivo mostra a pilha delas e uma coluna à esquerda com cada uma, a do agente marcada, e o QA olha qualquer uma sem mexer no agente. Um Claude Code real (Haiku) andou um mural com duas contas assim, e o caso gravado anda de novo sem ele.

**Um caso que passou é andado de novo sem o agente.** As ações de cada passo são gravadas com as
palavras na tela que o provaram, e a próxima run as repete no dispositivo e confere as palavras:
segundos e nenhum custo, contra dezenas de segundos e alguns centavos com o agente. Quando o app
mudou e uma palavra não aparece, o agente anda o caso de novo e o grava outra vez ("ajustado"). Os
casos gravados exportam como um arquivo de teste do Playwright ou fluxos do Maestro, gestos
incluídos. Um Claude Code real gravou um plano web e um Android assim, os dois andados de novo
sem agente, e o arquivo de Playwright exportado passou no Chrome; os fluxos do Maestro ainda não
rodaram no Maestro. O `tests/smoke/replay.test.ts` prova isso com um agente fake.

**Uma exploração não precisa de plano.** Do chat vazio, do botão Explorar do workspace ou do
Estagiário, o agente do QA percorre o app sozinho por dez minutos: anota cada tela que alcança,
registra o que está quebrado como bugs, e termina com um plano sugerido que espera num cartão no
chat até o QA levá-lo ao plano. É uma run própria, gravada como uma, com as telas dela como os
passos de um caso só; um fim com mais de um terço do tempo sobrando é devolvido uma vez. Um Claude
Code real (Haiku) explorou um app de reservas com seis bugs plantados e achou quatro em cerca de
um minuto, entrando com as variáveis do projeto; o `tests/smoke/explore.test.ts` dirige um agente
fake no Chrome real, e pelo app só um explorador fake foi até agora.

**Um projeto guarda os logins e segredos dele como variáveis**: um nome, o que ele guarda, e um
valor lacrado pelo keychain do SO na main, que o agente lê pelo nome. O QA diz se cada uma é
segredo: um segredo nunca volta à página, e o valor de um e-mail ou de um usuário aparece na janela
do projeto quando ele pede. Um
campo que mostra o que foi digitado ainda o mostra na foto da tela que o agente recebe. O QA
as adiciona na janela do projeto, ou as digita numa janela que o chat ou o Estagiário abre:
quando um plano precisa de uma conta, o agente do chat oferece as variáveis que servem e uma opção
que cria o que falta. Um passo nomeia uma como `${NAME}`. A run digita o valor dela, lê de volta
como o nome dela qualquer valor que a tela mostre, e guarda o nome nas receitas e no código
exportado. No Linux sem armazenamento de segredos o QAzinho não guarda nenhuma, e o Android digita
todo caractere menos aspas duplas, que ele recusa. Um preview que a Vercel protege, ou um staging
atrás de um login do navegador, abre com as variáveis `VERCEL_AUTOMATION_BYPASS_SECRET`, ou
`BASIC_AUTH_USER` e `BASIC_AUTH_PASSWORD`, mandadas só para a origem do app (`webAccessOf`), numa
run aqui e no CI. Uma senha escrita à mão num plano é oferecida como variável pela aba Plano, e o
chat segura uma. O `tests/smoke/variables.test.ts` prova a run no Chrome real com um agente fake, e
um Claude Code real (Haiku) planejou um login pedindo a conta pela janela, depois entrou com os
valores lacrados: 8 passos de 8, sem valor no plano nem no relatório.

**Toda run é gravada e toca de volta com a linha do tempo dela.** Um navegador é gravado a partir
do stream vivo, um simulador pelo `simctl`, um emulador pelo console dele. O vídeo da run abre num
teatro: um capítulo por caso na cor do veredito dele, um pino por bug, um still de qualquer
momento sob o cursor, e os passos ao lado, mantidos em sincronia. Cada caso oferece a sua gravação
em Runs, e cada bug o seu momento em Bugs. O `tests/smoke/record.test.ts` prova a gravação do
navegador. Um vídeo é guardado por 30 dias por padrão, depois solto sozinho: a run mantém o
relatório, as telas e os vereditos, e o teatro dela diz que o vídeo se foi e quando. Configurações
› Armazenamento diz o que o QAzinho guarda no computador e por quanto tempo os vídeos ficam; um
vídeo já mandado para a conta do QA nunca é mandado de novo sem ela. Toda tela, a de um celular
também, é um JPEG no tamanho cheio.

**Uma run web guarda a rede ao lado do vídeo.** O Chrome anota cada pedido que o app faz, com o
status, o tempo e o tamanho, e a run os guarda com o valor de uma variável escrito como o nome
dela e um token como pontos. No teatro, o botão Rede dobra uma faixa aberta sob o vídeo: cada
pedido cai quando o vídeo o alcança, espera a resposta dele e leva o vídeo até lá num clique, e um
que falhou deixa uma marca na linha do tempo. Com a faixa à mostra, Baixar refaz o vídeo com a
faixa desenhada sob ele. O `tests/smoke/network.test.ts` prova a captura no Chrome real, e o
`strip.test.ts` a faixa e o download no app construído. Uma run de celular ainda não guarda rede.

**O agente lê as chamadas de API também.** Cada ação dele na web diz quais chamadas de API falharam
enquanto ela rodou e o que responderam, e o `network` lista as últimas chamadas ou lê o que uma
respondeu, um 200 com dados de cara errada incluído: o agente as pesa no veredito e nomeia a
chamada que falhou no bug, como a causa provável. A resposta de uma chamada que falhou é guardada
ao lado da run, e um bug mandado ao Jira ou ao GitHub a carrega sob o pedido. Segredos aparecem
como pontos e o valor de uma variável como o nome dela, em todo lugar. O `tools.test.ts` e o
`network.test.ts` provam isso no Chrome real; um agente real ainda não o usou.

**O QA anexa imagens e arquivos no chat.** O clipe do composer, ou colar e arrastar, guarda cada
arquivo na pasta do workspace, e o agente do QA o lê com a mensagem: uma tela com um erro, o PDF de
uma proposta, a planilha de um caso. Um Claude Code real (Haiku) leu o código escrito numa imagem
anexada; um PDF e o Codex ainda não foram tentados.

**Os testes que o time já tem viram um plano.** O `/import` no chat, também oferecido no chat vazio e na criação do
workspace, escolhe uma pasta do computador do QA: o QAzinho a lê sem mudar nada e reconhece o que
dirige os testes (Playwright, Cypress, Maestro, Detox, WebdriverIO, Appium, Selenium) pela config,
pelos pacotes e pelos arquivos de teste, e o agente do próprio QA lê a pasta de volta, confirma o
framework pelos arquivos e escreve o plano: um caso por teste, os passos nas palavras do QA e nunca
nomeando seletor ou arquivo, o que o teste afirma como resultado esperado, o que ele monta antes
como pré-condição, e logins e chaves como variáveis do projeto. O que não dá para traduzir ele diz
em vez de inventar. Testes unitários e o prompt fixado do harness provam isso; nenhum agente real
importou uma pasta ainda.

**O agente pergunta ao QA no meio da run.** O agente de um caso, ou o explorador, que não pode
seguir sem o QA chama `ask_qa`: um código mandado por texto ao celular dele, uma escolha que o caso
deixa aberta, uma tela que só ele pode julgar. A run segura e o chat mostra a pergunta num cartão,
com as respostas que ela oferece; a sidebar, o cabeçalho e o dispositivo dizem que a run espera o
QA. Um segredo é digitado num campo escondido e vai como uma variável: o agente digita `${NAME}` e
lê o nome, e o projeto o guarda quando o QA diz. Sem resposta em 15 minutos o agente segue sem
uma, e o Stop termina a espera. As respostas ficam na seção da run e em Runs, no passo em que
foram perguntadas. O `tests/smoke/ask.test.ts` prova isso com um agente fake no Chrome real. Um
Claude Code real (Haiku) perguntou em português qual plano escolher e, como segredo, o código
mandado ao celular, depois passou o caso, o código em nenhum evento; ele segurou uma chamada por 16
minutos. Pelo Codex isso não foi tentado.

**Uma run que termina chama o QA de volta** enquanto ele está longe: uma notificação com o som dela
e uma contagem no ícone do app, a menos que ele tenha pedido para ouvir só dentro do app, onde um
aviso diz isso. Uma pergunta de uma run o chama de volta do mesmo jeito.

**Uma ilha no topo da tela mostra a run, onde o notch está.** Enquanto uma run anda, o agente
espera o QA ou uma run acabou de terminar, um pill preto colado ao centro do topo da tela veste o
notch: pequeno por padrão, só com o Estagiário na orelha esquerda, sempre, com o humor do que acontece (correndo, pensando
quando o agente pergunta, dormindo numa run pausada, feliz ou com um bug no fim), e um ícone de estado na direita, que
cresce com animação quando aparece o passo de N; com o mouse em cima, ele abre
abaixo do notch com o workspace, o passo, o progresso e os botões Abrir e Parar. Uma pergunta do
agente a deixa chamando (o Estagiário pensa, o ícone pulsa em âmbar e o pill dá uma pulsada só), mas ela só abre com
o mouse em cima, para nunca atrapalhar quem trabalha em outra coisa. Aberta, ela responde ali
mesmo: um clique numa das opções do agente, ou as palavras do QA num campo que pega o teclado só
enquanto ele digita, sem tirar da frente o app em que ele está. Um segredo continua sendo digitado
no app. Quando agentes de vários projetos esperam, a orelha conta as perguntas e a ilha aberta anda
entre elas com setas, da mais antiga à mais nova, nomeando o projeto e o workspace de cada uma. Numa
tela sem notch ela fica pendurada na borda de cima, um pill menor, e o QA a desliga em Configurações
› Aparência. Dois Claude Code reais (Haiku), em dois projetos, perguntaram ao mesmo tempo no app
construído e foram respondidos pela ilha, um pelo campo e outro por uma opção, até as runs passarem;
o `tests/smoke/island.test.ts` prova a janela e o teclado. Os cliques e teclas desses testes são
sintéticos, nenhum atravessou o macOS; ainda não se viu a ilha com um app em tela cheia ou um
monitor externo, nem no Windows ou no Linux.

**O agente de código do QA usa o QAzinho de fora.** Ligado em Configurações › MCPs, o QAzinho vira
um servidor MCP neste computador, com 41 ferramentas. A regra: o que o QA faz à mão no QAzinho tem
uma ferramenta, e o que só a IA faz, como planejar a partir de uma história, de um design ou do
código, vai pela conversa com o chat do workspace. O agente com que o QA ou o dev trabalha no
próprio editor cria o projeto e o workspace de um app que o QAzinho ainda não conhece, escreve,
altera e apaga casos do plano, troca o alvo de um projeto, liga um repositório ou um design, constrói
o app, roda o plano ou uma exploração, pausa, retoma ou para a run, responde a pergunta dela (nunca
um segredo), leva ao plano a sugestão de uma exploração, exporta o código das gravações, publica o
plano no Confluence, espera o resultado, lê o que quebrou (as
telas como arquivos, as chamadas de API que falharam e o que responderam), fecha ou manda um bug ao
tracker, e conversa com o chat do workspace como o QA. A
mensagem dele aparece no chat marcada com as estrelinhas, "Seu agente", e o agente do QAzinho sabe
que não foi o QA quem escreveu. Antes de mudar ou apagar, a descrição da ferramenta manda o agente perguntar ao usuário no chat dele, com a ferramenta de perguntar que ele já tem, e só chamar depois do sim; o QAzinho não abre cartão. Ele também lista as variáveis de um projeto pelo nome e pela descrição, cadastra uma abrindo a janela onde o QA digita o valor, renomeia ou apaga uma, lê e muda as configurações, e conecta ou desconecta o GitHub e o Jira; nenhum valor ou token passa por ele, e o app não vem à frente. O QAzinho adiciona o servidor ao Claude
Code ou ao Codex em um clique, ou copia o endereço para outro agente. Um Claude Code real (Haiku),
de fora, achou um 500 plantado numa loja em 20 segundos e menos de dois centavos: rodou o plano,
leu o bug, abriu a tela e nomeou a chamada que falhou. O `tests/smoke/outside.test.ts` dirige o
servidor real com um cliente MCP no app construído. Dez sessões reais do Claude Code (Haiku), com as
sete ferramentas de antes, acharam o que quebrou, não seguiram uma instrução plantada numa página e
disseram quando a run esperava o QA; as de criar, mudar, apagar e conversar com o chat ainda não
foram usadas por um agente real. Pelo Codex isso não foi tentado.

**O mesmo agente alcança as orgs do QA, pela plataforma.** Com a conta logada, a mesma seção das
Configurações (`OutsideServerCard`, um cartão com os dois alcances) adiciona ao agente o servidor da
plataforma (`qazinho-org`), que funciona com o app fechado: ele entra pelo OAuth, com a pessoa dizendo
sim na `/connect` da web, e lê planos, runs, telas, bugs e o CI com o papel dela em cada org, além de
rodar uma regra, rodar uma run de novo, parar um job e comentar num bug. As chamadas do próprio QAzinho
ficam sem esse servidor (`AGENT_RUN.orgServer`), porque ele gasta os créditos da org e uma página sob
teste fala com o agente de uma run. O qazinho-server prova o fluxo com o cliente MCP real sobre a API
(`test/flow/mcp.test.ts`). Treze sessões reais do Claude Code (Haiku), com um token do login e numa
cópia do banco, responderam se um PR passou, acharam o plano de um fluxo e recusaram o que o papel não
deixa, por cerca de seis centavos. Ainda não rodou: o `/mcp` da CLI real com a `/connect` num navegador
de verdade, e o `get_screenshot` com uma tela de verdade; essa rota também não foi publicada ainda.

**Uma primeira execução anda pela máquina** (`Onboarding`): idioma, o agente, as ferramentas de
dispositivo, os trackers. O GitHub e o Jira conectam de verdade. O token do Jira é conferido com o
Jira e lacrado pelo keychain do SO.

**O GitHub passa pela GitHub CLI do próprio QA**, e o QAzinho não guarda token. Conectar roda o
device flow do gh fora de vista, ou pega um gh já logado, e instala o gh quando falta. Um projeto
então escolhe os repositórios dele, e o `/code` no chat planeja a partir de uma branch deles: a
branch base para o app inteiro, qualquer outra para o que ela mudou. O agente lê uma cópia da
branch, somente leitura, e a cópia some assim que o plano é escrito; o plano guarda o commit de
onde veio. Um Claude Code real planejou a partir de uma branch pública assim; pelo Codex isso não
foi tentado. O `tests/smoke/github.test.ts` dirige um gh fake.

**Um design do Figma é conferido contra a tela.** O `/figma` no chat recebe o link de um frame ou
página, e o agente do próprio QA o lê pelo MCP do Figma em que fez login nas Configurações: os
tamanhos, espaçamentos, cores, tipografia, textos, estados e as anotações dos designers. Ele planeja
com o QA, e cada passo que cai numa tela desenhada nomeia o frame dela, que o plano abre no Figma.
Uma run entrega a esses casos o mesmo Figma: o agente lê o frame, mede a tela com `inspect` (px de
CSS, tipografia e cores na web; dp no Android, pontos no iOS) e registra cada diferença como um bug
contra o design, cujo cartão e issue linkam o frame. Uma exploração faz o mesmo nas telas que o
design desenha, e sugere casos que nomeiam os frames deles. O Estagiário liga ou desliga um
design, entrega ao chat de um workspace um plano contra um, e lê quais passos e bugs pertencem a um
frame. Uma config de MCP estrita sob o mesmo nome e endereço reusa o login do Claude Code,
conferida contra a CLI real; o `tests/smoke/design.test.ts` dirige um agente fake no Chrome real, e
o `tools.test.ts` mede um controle lá. Um Claude Code real (Haiku) planejou a partir de um frame
real, capturado no Figma de uma página de checkout, e andou uma cópia com quatro diferenças
plantadas: registrou o título, o tamanho do total e a cor e os cantos do botão, cada um no frame
dele, por cerca de um centavo. O Figma conta cada leitura, algumas por mês em alguns assentos,
então um caso andado de novo a partir da receita não confere design nenhum.

**Uma história do Jira vira o requisito do plano.** Com o Jira conectado, o `/jira` no chat escolhe
uma história: as que o QA abriu por último, ou uma achada pela chave ou pelas palavras. O QAzinho a
lê inteira com o token do próprio QA: a descrição, os critérios de aceitação do campo que o time
usar, os comentários, as issues ligadas e subtarefas, e as imagens, PDFs e textos anexados,
baixados para o agente ler. O agente planeja a partir dela: cada critério ganha um caso que o
nomeia, o que a história deixa em aberto é uma pergunta, e o texto da história nunca é uma
instrução. Os arquivos somem assim que o plano é escrito; o workspace guarda a história, que o
cabeçalho e o plano dele abrem no Jira. O Estagiário entrega ao chat de um workspace uma história
pela chave. O QA também não precisa de comando para isso: a chave ou o link de uma história, ou o
link ou título de uma página do Confluence, nas palavras dele basta, e o agente do chat a lê pelo
QAzinho, com o Jira dela. Um Claude Code real (Haiku) achou uma página só pelo título e uma
história pela chave, contra um Jira e um Confluence fakes, e planejou a partir de cada uma. O
`tests/smoke/jira.test.ts` lê uma de um site do Jira fake, e um Claude Code real (Haiku) planejou a
partir de uma com uma tela anexada: leu a tela, perguntou sobre o que a história deixava em aberto,
e nomeou o critério que cada caso cobre. Um site real do Jira não foi tentado.

**Uma página do Confluence vira o plano, e o plano uma página do Confluence.** Com o Jira
conectado, o QA liga o Confluence no cartão do Jira: a mesma conta no mesmo site, conferida antes
com o Confluence. O `/confluence` no chat escolhe uma página, as que o QA trabalhou por último ou
uma achada pelo título, e o agente planeja a partir do texto dela: mantém os casos que o time
escreveu ali, os passos e resultados esperados deles, pergunta sobre o que a página deixa em
aberto, e não toma nada nela como instrução. A aba Plano publica o plano como uma página: a
primeira vez no espaço e sob a página que o QA escolhe, cada caso com os fatos e os passos dele
numa tabela com como a última run foi; depois o mesmo botão escreve a versão seguinte da página.
O `tests/smoke/confluence.test.ts` lê e publica num site do Confluence fake, e o app construído
andou tudo contra um. Um Claude Code real (Haiku) planejou a partir de uma página de três casos
por cerca de quatro centavos: manteve os passos deles, perguntou o que a página deixava em aberto,
e nomeou uma nota que mandava responder em prosa como o texto da página, não uma ordem. Um site
real do Confluence não foi tentado.

**Um bug vai ao tracker do QA como uma issue.** Um bug aberto se manda do cartão dele, ou o
Estagiário o manda quando o QA confirma num cartão. Ao Jira ele vai como um Bug do projeto que o QA
escolhe: os passos dele com o que quebrou, o que se esperava e o que veio, os pedidos que falharam
em volta e onde foi pego, com as telas e um clipe do momento cortado do vídeo da run anexados (a
gravação inteira de um celular, quando tem menos de 25 MB), e um link para a história de onde o
plano veio. Ao GitHub ele vai pelo gh do próprio QA, como uma issue em Markdown com o rótulo bug;
o GitHub aceita imagens só na página dele, então o QAzinho copia a tela para o QA colar. O bug guarda
a chave da issue dele, e o projeto guarda para onde foi o último bug dele.
O `tests/smoke/filing.test.ts` registra bugs num Jira fake e por um gh fake, e o app construído
mandou um para cada; um site real do Jira ou um repositório real não foi tentado.

**Um bug visto de novo depois de registrado chega à issue dele como um comentário**, nunca
reescrevendo-a. Quando uma run termina, o agente do QA lê a issue como está, o status e os
comentários, ao lado das runs que pegaram o bug de novo, e diz se elas acrescentam algo que a issue
não tem, se o bug voltou depois de a issue ser fechada, ou nada. O que ele sugere espera no cartão
do bug, onde o QA o edita e o posta com um clique, ou o põe de lado; o Jira recebe as telas e o
clipe novos com ele. Uma issue fechada é chamada de regressão e nunca reaberta. O
`tests/smoke/review.test.ts` pesa uma por um agente fake e um Jira fake, e o app construído postou
uma; um agente real ainda não pesou uma.

**O Estagiário responde da barra de título.** O rosto dele, no fim dela, abre um chatzinho logo
abaixo, onde o agente do próprio QA fala de qualquer projeto, workspace, run ou bug. Ele também faz o que o QA
poderia fazer à mão: abrir uma tela, criar ou mudar um projeto, ligar um repositório, criar,
renomear, rodar ou parar um workspace, mudar as configurações, conectar um tracker, e apagar,
desconectar ou mandar um bug a um tracker quando o QA confirma num cartão. Um plano ele entrega ao
chat próprio do workspace, que o escreve com o QA, e ajuda a responder as perguntas desse chat. O
chat dele sobrevive a um reinício. Ele também fala sozinho, num balão sob o rosto que sai em alguns
segundos: um comando sem a integração dele leva o QA até ela, e o balão diz o que fazer lá. O `tests/smoke/assistant.test.ts` o dirige com um agente fake
sobre o servidor MCP real, e um Claude Code real (Haiku) o dirigiu por um dia de um QA nos dois
idiomas; pelo Codex não.

**O app é construído a partir do próprio código.** Um projeto que nomeia os repositórios dele
constrói o .apk ou o .app de simulador a partir de qualquer branch, do cartão do projeto ou
pedindo ao Estagiário. O agente do próprio QA o constrói numa cópia da branch: React Native, Expo,
Flutter ou um app nativo, um build que roda sozinho no emulador ou simulador. O que ele fez é
conferido, guardado, e vira o alvo do projeto. O `tests/smoke/build.test.ts` o dirige com um gh
fake e um agente fake. Um Claude Code real (Haiku), pedido pelo Estagiário, construiu um app nativo
de Android com o Gradle a partir de uma branch que um gh fake entregou; React Native, Expo, Flutter
e iOS ainda não foram construídos por um agente real. As chamadas do QAzinho rodam com os hooks do
próprio Claude Code do QA desligados: um hook que reescreve comandos, como o do rtk, fazia todo
comando do Gradle falhar nas permissões do build.

**O agente lembra do app entre uma run e outra.** O que o QA diz no chat ou no meio de uma run, as
respostas às perguntas do agente e o que o agente disse enquanto andava são pesados por um agente
próprio, no modelo mais barato (Haiku no Claude Code), que guarda, corrige ou esquece fatos curtos do
projeto ou de um plano. Uma linha no chat diz o que ele anotou ("Anotei: ...", "Esqueci: ..."), e a
janela do projeto lista as memórias para ver e apagar. Cabem 30 por projeto e 10 por plano, de até
200 caracteres: o agente lê todas, e numa lista cheia o guardião junta fatos ou solta um para outro
entrar. O agente as lê em toda run, exploração e chat,
e diz uma vez por memória quando usa uma. Memória ajuda a chegar e nunca decide um veredito. Num
projeto publicado, elas vão à org e voltam, a versão escrita por último vencendo. Um Claude Code real
(Haiku) perguntou onde ficava uma tela, foi lembrado e, na run seguinte, foi direto, sem perguntar; o
QA ensinou e fez esquecer pelo chat. Numa bateria de 24 runs num app falso, as perguntas de "onde
fica" foram de 5 em 6 runs para 0 em 6, e uma memória envenenada nunca aprovou um bug (5 de 5). Numa sequência de 77 fatos sobre 52 assuntos, o guardião abriu lugar sozinho nas 7 vezes em que a lista encheu. O
`tests/smoke/memory.test.ts` prova o ciclo com um agente fake; o guardião acerta 152 de 162 cenários
e barrou 36 de 36 perigosos no Haiku. O Codex e uma ida e volta real à org ainda não foram tentados.

**O QAzinho Pro é um cartão no pé da sidebar, e nada mais.** O cartão fala da conta do QA e nunca
nomeia um plano, já que o Pro não será o único. Sem login, ele faz este computador entrar por um
código que o QA confirma no navegador, o token lacrado pelo keychain do SO. Com login, todo projeto
vai à org para a qual a conta aponta, em segundo plano: o que mudou desde a última vez, as telas e
vídeos das runs dele, sem carregamento e nada novo na tela, então o app é o mesmo que sem login.
Um plano que a org também mexeu é juntado caso a caso, sem pedir, e um que a org mexeu enquanto
nada mudou aqui, como um pull request mergeado, entra a cada poucos minutos. O cartão nomeia a
conta e a org dela, sinaliza uma org bloqueada ou uma conta que só lê, e baixa os projetos da org
com as gravações deles. O "Abrir no desktop" de um plano na web (`qazinho://open`) abre o
workspace dele aqui, ou oferece baixar o projeto dele da org primeiro. Testes unitários o dirigem
contra uma plataforma fake; a API da plataforma (qazinho-server) ainda está sendo construída,
então nenhuma ida e volta real rodou, e nenhum app instalado abriu um link ainda.

**O app se atualiza sozinho, sem parar o QA.** Instalado, ele procura uma versão nova ao abrir e a
cada 4 horas, baixa em segundo plano e instala ao fechar; quando ela está pronta, um "Atualizar"
discreto aparece na barra de título. Não há rollback: uma versão ruim se desfaz publicando uma maior.
Só uma conta logada pode ser obrigada a atualizar: a API recusa uma versão abaixo do mínimo dela, e o
app vira uma tela que atualiza, menos com uma run andando; sem login nada trava. O
`tests/smoke/update.test.ts` anda isso no app construído contra um feed e uma API fakes. Um Mac
instalou de verdade com um certificado descartável: a 0.0.1 achou a 0.0.2 num feed local, baixou,
mostrou o botão, e o app no disco virou a 0.0.2; uma assinatura recusada tirou o botão. O build real
gerou neste Mac os feeds dos três sistemas. Ainda não rodou: uma release pelo CI, um Mac notarizado,
uma instalação no Windows ou no Linux, e a recusa do servidor real com um app logado. O
`qazinho-releases` nasceu privado e precisa ficar público antes de o primeiro QA instalar.

**O Codex está meio verificado.** O QAzinho o dirige por `codex exec --json` e o servidor MCP
próprio dele, conferido contra um Codex fake construído a partir dos eventos do real. O chat
respondeu por um Codex real logado (CLI 0.163.0), no schema estrito; uma run, com as ferramentas de
dispositivo por MCP, não. Isso é para nós sabermos, não para o QA: nenhuma ressalva sobre os testes
do próprio QAzinho vai para a interface.

## Regras obrigatórias

@rules/architecture.md
@rules/code-structure.md
@rules/components.md
@rules/sticker-design.md
@rules/design-tokens.md
@rules/animation.md
@rules/i18n.md
@rules/comments.md
@rules/testing.md
@rules/tooling.md
@rules/platforms.md
