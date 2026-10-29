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
O limitador de abuso já existente continua usando IP, sem qualquer ownership.

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
no banco, porém inacessíveis. O limitador existente continua local/em memória;
produção com múltiplas instâncias precisa da proteção de abuso compartilhada
já documentada para autenticação.

## Registro da implementação e validação anterior à revisão final

Antes de criar a migration, o preflight leu somente contagens e histórico do
PostgreSQL local: 1 User, 0 Demos, 7 Sessions, nenhuma Área sem proprietário,
5 migrations anteriores aplicadas e ausência de DemoTransfer. A migration
`20261029010000_demo_transfer` apenas cria tabela, dois índices únicos e FKs;
não altera linhas ou restrições das tabelas existentes. Foi aplicada com
`prisma migrate deploy --config prisma7.config.ts`, sem reset ou backfill.
Prisma Client foi gerado com as dependências já instaladas.

Testes locais controlados, com HTTP e PostgreSQL reais e fixtures próprias:

```powershell
$env:FOCUSLIST_AUTH_TESTS = 'LOCAL_CONTROLLED'
npm run test:demo
npm run test:auth
npm run test:password-recovery
node --test tests/password-recovery-postgres.test.mjs
```

`demo-postgres.test.mjs` cobre criação vazia, cookie e hash, retomada/refresh,
isolamento bidirecional dos cinco recursos, troca de pai alheio, Dashboard e
Arquivados, CRUD, arquivamento/restauração, cadastro REAL e revogação da Demo,
persistência do vínculo, IDs arbitrários, importação alheia/duplicada,
concorrência, rollback após todas as escritas, preservação integral da árvore,
sessão final REAL, descarte, perda de contexto, expiração antes/depois do
cadastro e saída. Testa também a limpeza física e a preservação de REAL e Demo
válida; a manutenção não é executada se existir qualquer Demo externa às fixtures.
As fixtures são removidas sem resetar banco ou sequências.

Resultados até esta etapa: Demo 13/13; autenticação 28/28; senha/e-mail 15/15;
recuperação PostgreSQL 1/1. Prisma validate e builds backend/frontend passaram.
O Vite avisou sobre o bundle principal acima de 500 kB; não foram alteradas
dependências ou arquitetura de carregamento fora do escopo.

Validação visual desktop/mobile: **pendente de autorização separada**, conforme
AGENTS.md e a especificação. Nenhum navegador ou screenshot foi aberto até
essa autorização. Atualizar este registro após eventual validação autorizada.

Arquivos novos: migration DemoTransfer; demo routes/controller/service/repository;
script de limpeza; testes Demo; este documento; DemoStartButton; DemoFrame;
DemoEndedPage; DemoImportPage; demo.css. Arquivos existentes ajustados: schema,
package.json do backend (somente scripts), app.ts, autenticação backend,
AuthContext/AuthGate/AuthPage/authService, AppRoutes, AppLayout, Sidebar e
LandingHero. `AUTHENTICATION.md` passa a apontar para este contrato.

`.env`, dependências e lockfiles não foram alterados. A alteração preexistente
de `.gitignore` foi preservada: SHA-256 inicial/final
`F2F20C96D12E32535201FAE58533A42314449F7D2333DAEDEBFF0D47841C5637`.
Não houve commit, push ou deploy.

## Registro anterior dos arquivos e do status

Arquivos existentes modificados (`M`):

```text
backend/AUTHENTICATION.md
backend/package.json
backend/prisma/schema.prisma
backend/src/app.ts
backend/src/controllers/auth.controller.ts
backend/src/middlewares/auth.middleware.ts
backend/src/repositories/auth.repository.ts
backend/src/services/auth.service.ts
frontend/src/auth/AuthContext.tsx
frontend/src/auth/AuthGate.tsx
frontend/src/components/Sidebar.tsx
frontend/src/components/landing/LandingHero.tsx
frontend/src/layouts/AppLayout.tsx
frontend/src/pages/AuthPage.tsx
frontend/src/routes/AppRoutes.tsx
frontend/src/services/authService.ts
```

Novos arquivos (`??`, ainda não adicionados ao índice):

```text
backend/DEMO_MODE.md
backend/prisma/migrations/20261029010000_demo_transfer/migration.sql
backend/src/controllers/demo.controller.ts
backend/src/repositories/demo.repository.ts
backend/src/routes/demo.routes.ts
backend/src/scripts/cleanup-demos.ts
backend/src/services/demo.service.ts
backend/tests/demo-postgres.test.mjs
frontend/src/components/DemoStartButton.tsx
frontend/src/demo.css
frontend/src/demo/DemoFrame.tsx
frontend/src/pages/DemoEndedPage.tsx
frontend/src/pages/DemoImportPage.tsx
```

O status inclui também `M .gitignore`, alteração anterior a esta tarefa e
preservada byte a byte. Não há arquivos staged. `git diff --check` passou;
`git diff --stat` e `git status --short` foram executados. O diff --stat padrão
não inclui arquivos novos ainda não adicionados ao índice. Os avisos de Git
são de conversão LF/CRLF no Windows, sem erros de whitespace.

As contagens locais após as suítes voltaram a 1 User REAL, 0 Demos, 7 Sessions
e 0 vínculos de importação, com 6 migrations aplicadas. As validações não
enviaram e-mails reais. As fixtures foram removidas e os registros anteriores
preservados. As sequências avançaram normalmente durante os testes e não foram
resetadas.

Referência de semântica dos bloqueios usados: [documentação oficial PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html).

## Revisão final desta etapa — 29/10/2026

A revisão do código abrangeu entrada, sessão de 24h, isolamento DEMO/REAL,
CRUD, cadastro, importação transacional, descarte, expiração e saída. A suíte
Demo recebeu cobertura explícita de exclusão da própria árvore, respeitando o
arquivamento obrigatório e verificando a preservação das demais identidades.

Os refinamentos foram conferidos pelo código: “Sair” da sidebar oculto somente
na Demo; botões do cabeçalho Demo sem deslocamento no hover; autofill escuro
nos campos compartilhados de autenticação; header da Landing visível no topo,
oculto a partir de 120px e novamente visível em 60px ou menos, com transições
de 380ms. As regras existentes de movimento reduzido continuam aplicáveis.
O breakpoint da moldura e da sidebar móvel é 800px. A experiência renderizada
desktop/mobile, o autofill nativo e a fluidez visual não foram verificados em
navegador, conforme a restrição do AGENTS.md.

Prisma validate e builds backend/frontend passaram. Os 15 testes de senha,
recuperação e transporte de e-mail passaram; o caso HTTP exigiu permissão de
conexão local fora do sandbox. O bundle principal tem 503,91 kB minificado
(150,33 kB gzip): aviso não bloqueante, reservado para otimização futura.

A reexecução final das suítes PostgreSQL de Demo, autenticação/isolamento e
recuperação foi autorizada explicitamente pelo usuário: 43 verificações no
relatório do Node, 42 aprovadas, nenhuma falha e uma pulada. A limpeza global
foi pulada pela proteção da suíte porque existem Demos externas às fixtures;
esses dados foram preservados. Os hooks de remoção das fixtures concluíram,
incluindo as verificações de retorno à contagem inicial de usuários nas suítes
Demo e autenticação. Nenhum e-mail real foi enviado. As sequências avançaram
normalmente, sem reset. A limpeza global permanece sem revalidação nesta rodada.

O diff e os 32 arquivos desta etapa foram revisados sem credenciais reais,
tokens de produção ou dados pessoais identificados. Senhas literais nos testes
são fixtures sintéticas. `.env.example` contém somente placeholders seguros;
dependências e lockfiles não foram alterados. `.env` permanece ignorado e fora
do índice; `.gitignore` preexistente permanece intacto e fora do índice.
Nenhuma funcionalidade foi acrescentada durante esta revisão. A seleção para
commit abrange somente os 32 arquivos do Modo Demonstração e dos refinamentos
desta etapa, com revisão do staged diff antes do commit solicitado
`feat: implementar modo demonstração`. A verificação final de sincronização
com `origin/main` e o status após o push são informados na entrega. Não há deploy.
