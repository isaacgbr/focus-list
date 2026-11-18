# Modo Demonstração do FocusList

## Arquitetura e experiência

O fluxo mantém Route → Controller → Service → Repository → Prisma → PostgreSQL.
`demo.routes/controller/service/repository` cuidam do ciclo da Demo; os mesmos
endpoints e componentes de Área, Lista, Tarefa, checklist, links, Dashboard e
Arquivados continuam executando o produto real. Nenhum dado inicial é criado.

A Landing ganha somente a ação “Ver demonstração”. Em `/app`, `AppLayout`
envolve o produto em `DemoFrame` apenas quando a identidade é DEMO. A moldura
usa o fundo existente do FocusList, título “Demonstração FocusList”, aviso de
24h, cadastro e saída. Em até 800px, desaparecem borda e margem externas; o
menu móvel existente é mantido. Não há nova animação nem tutorial.

## Identidade, sessão e isolamento

`POST /auth/demo` aceita somente `{}` ou corpo ausente. Cria User DEMO sem
nome, e-mail ou senha e uma Session com token aleatório de 256 bits. Somente
SHA-256 é persistido. Usa o cookie existente HttpOnly/SameSite=Lax, Secure e
prefixo `__Host-` em produção, Path=/ e sem Domain. Não usa IP como identidade.
O limitador de abuso usa IP, sem qualquer ownership, e é complementado pelo Vercel Firewall em produção.

User e Session vencem juntos, exatamente 24h após criação. Essa duração também
respeita o CHECK já existente em User. Reabrir com cookie DEMO válido recupera
a identidade e token existentes, sem estender a validade. Refresh consulta
`GET /auth/session`, sem criar outra Demo. Abas compartilham o cookie.

`requireAuth` exige sessão não revogada e não vencida; para DEMO também exige
`User.expiresAt > agora`. Toda consulta/escrita do domínio continua filtrada
pela ownership existente em `User → Area → List → Task → ChecklistItem/Link`.
O cliente não define o proprietário nem passa IDs de origem para importação.
Mantêm-se os controles de origem/CSRF, corpo JSON, campos permitidos, limites,
cookies, erros genéricos e `Cache-Control: no-store` existentes.

O navegador guarda em sessionStorage somente a pista visual `focuslist:demo`
para mostrar a tela de encerramento após o cookie expirar e um refresh. Essa
pista não contém IDs/tokens e nunca autoriza acesso. O servidor é a autoridade.
Há temporizador no frontend e revalidação ao voltar para uma aba Demo; nenhum
deles cria nova identidade automaticamente.

## Sessão REAL já ativa

Uma chamada a `/auth/demo` com sessão REAL válida retorna `409`, sem revogá-la,
sem criar Demo e sem emitir cookie. A Landing informa que há uma sessão ativa
e oferece voltar ao FocusList. `POST /auth/demo/exit` exige identidade DEMO:
um REAL recebe `403` e mantém seu cookie. Não existe sessão paralela REAL+DEMO.

## Saída

`POST /auth/demo/exit` aceita corpo vazio e revoga as sessões da identidade
DEMO dentro de transação, apaga o cookie e retorna `204`. O frontend retorna
à Landing, sem iniciar outra Demo. Reutilizar o cookie antigo não dá acesso.
As Áreas restantes permanecem inacessíveis até a limpeza física após 24h.

## Cadastro e contexto seguro de importação

O link usa `/cadastro?origem=demo`, com o mesmo formulário e regras existentes.
O indicador `fromDemo: true` no cadastro é apenas uma intenção, nunca uma
credencial. O backend deriva a origem exclusivamente do cookie enviado.

No cadastro vindo de Demo, a transação bloqueia o User de origem e revalida a
Session e os 24h. Ela cria uma conta REAL distinta, emite uma nova Session REAL,
registra `DemoTransfer(demoUserId UNIQUE, sessionId UNIQUE)` e revoga todas as
sessões DEMO. Cadastro, sessão, vínculo e revogação têm o mesmo commit/rollback.
Já nessa fase a identidade antiga perde acesso, inclusive em outra aba.

Apenas o token da nova sessão REAL substitui o cookie. O contexto sobrevive ao
refresh no banco, associado a essa sessão, sem segundo cookie, token público,
ID de Demo aceito no corpo ou localStorage como autorização. A API de sessão
retorna apenas `demoImport: pending/unavailable/null`, além do usuário público,
tipo e validade. IDs internos do vínculo e hashes não são retornados.

O cadastro convencional continua sem login automático. Apenas o cadastro
originado de Demo inicia a sessão REAL para permitir a decisão imediatamente.
Não se importam dados em login de conta já existente. Logout, rotação de sessão
ou perda do cookie REAL podem perder a capacidade de importação: não é possível
reconstituí-la por e-mail ou ID. A conta continua utilizável com login normal.

Se a Demo expirar ou o cookie desaparecer antes de concluir o cadastro, a conta
REAL ainda é criada e autenticada, com aviso de contexto indisponível. Não é
criado vínculo de transferência a partir de uma sessão inválida. Sessão REAL
já ativa com `fromDemo: true` recebe `409`, sem criar conta ou trocar cookie.

## Decisão e transferência

Após cadastro, `/demo/dados` mostra “Conta criada!” e a decisão solicitada.
O frontend mantém o acesso à decisão enquanto houver vínculo pendente.

`POST /auth/demo/resolve` aceita **somente** `{ action: "import" | "discard" }`.
Exige sessão REAL. O repositório bloqueia a Session REAL, verifica validade,
revogação e ownership, busca o vínculo por essa sessão e bloqueia o User DEMO.

Em `import`, revalida que o User de origem é DEMO e não expirou, muda somente
`Area.userId` das raízes dessa Demo para o User REAL, revoga sessões DEMO e
marca `resolvedAt`. Tudo acontece na mesma transação. Não há cópia de registros:
IDs, relacionamentos, checklist, links, prioridades, datas, conclusão,
arquivamento, descrições e demais propriedades dos descendentes permanecem.
Somente o dono e `updatedAt` das Áreas mudam. Falha faz rollback completo.

Em `discard`, apenas encerra o vínculo e revoga sessões DEMO; nenhuma Área muda
de dono. É permitido descartar um vínculo cuja Demo já expirou. A conta REAL
permanece ativa, inclusive se o contexto original já não existir. Nesse último
caso, o frontend trata `409` no descarte como continuação segura na conta vazia.

O endpoint não altera cookies REAL. Um vínculo consumido/inexistente retorna
`409`; Demo tentando escolher recebe `403`; Demo expirada não importa (`410`).
Importações concorrentes são serializadas: uma vence, outra falha. Corpos com
`demoUserId`, `userId` ou outros campos adicionais recebem `400`.

## Expiração e limpeza

A expiração lógica é obrigatória em cada requisição, mesmo se uma Session
tiver validade maior por erro externo. Após expiração não há leitura, escrita
ou importação. O frontend mostra encerramento com “Voltar ao início” e
“Ver nova demonstração”. Somente esta última ação cria uma nova Demo vazia.

Foi implementada uma manutenção manual pequena, sem endpoint público nem
infraestrutura nova, em `src/scripts/cleanup-demos.ts`:

```powershell
npm run demo:cleanup
```

Cada execução bloqueia até 50 User DEMO expirados, com `FOR UPDATE SKIP LOCKED`,
comparando timestamps explicitamente em UTC para não depender do fuso da conexão,
apaga suas Áreas e então os próprios usuários numa única transação. Os
descendentes, sessões e vínculos são removidos pelas cascatas existentes.
Filtros de tipo e expiração são repetidos nas exclusões. Nunca seleciona REAL
ou Demo válida. Executar novamente processa o próximo lote. **O comando não foi
executado contra os dados persistentes existentes.**

Fica pendente acionar essa manutenção periodicamente pelo ambiente operacional.
Não foi adicionado scheduler. Sem execução, registros vencidos ficam fisicamente
no banco, porém inacessíveis. O middleware local e o Vercel Firewall preservam
a proteção de abuso documentada para autenticação.

## Testes

A suíte `tests/demo-postgres.test.mjs` cobre isolamento, CRUD, expiração,
importação concorrente, rollback, descarte e saída. Usa fixtures próprias e
exige autorização para escrita no PostgreSQL local:

```powershell
$env:FOCUSLIST_AUTH_TESTS = 'LOCAL_CONTROLLED'
npm run test:demo
```

A limpeza global é ignorada se a suíte detectar Demos externas às fixtures.
O histórico Git preserva os registros anteriores de implementação e validação.
