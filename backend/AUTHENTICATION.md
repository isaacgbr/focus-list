# Autenticação e propriedade de Áreas

Contrato da implementação multiusuário do backend. O fluxo DEMO, recuperação
de senha e Perfil permanecem fora desta etapa.

## Contrato HTTP

| Método | Rota | Corpo / resposta |
| --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password, confirmPassword }` → `201 { user }` |
| POST | `/auth/login` | `{ email, password }` → `200 { user }` e cookie de sessão |
| GET | `/auth/session` | Sessão válida → `200 { user }`; caso contrário, `401` |
| POST | `/auth/logout` | Sem corpo ou `{}` → `204`, revoga a sessão atual e apaga o cookie |

Cadastro não inicia sessão automaticamente. O usuário público contém apenas
`id`, `name`, `email` e `createdAt`. Login inválido retorna a mesma mensagem para
conta ausente e senha incorreta. E-mail é normalizado com trim/lowercase.
Nome deve ter de 1 a 100 caracteres, sem controles; senha, de 15 a 128 caracteres
(até 512 bytes), sem truncamento nem trim. A confirmação deve ser idêntica.
Campos desconhecidos são rejeitados; `userId`, relações Prisma e hashes não são
aceitos nos corpos do domínio como identidade ou propriedade.

## Senhas e sessões

Senhas usam `node:crypto.scrypt` assíncrono, salt aleatório de 16 bytes,
`N=131072`, `r=8`, `p=1`, chave de 64 bytes e comparação em tempo constante.
Formato persistido inclui algoritmo, parâmetros, salt e chave. Os parâmetros
seguem a [orientação OWASP para scrypt](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt).
A API é nativa do [Node.js](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback);
nenhuma dependência foi instalada. Há limite de duas derivações simultâneas,
sem fila ilimitada.

Cada login gera token aleatório de 32 bytes. Apenas SHA-256 desse token fica em
`Session`; SHA-256 não é usado para senhas. O token é enviado exclusivamente no
cookie HttpOnly, SameSite=Lax, Path=/, sem Domain, por sete dias. Em produção,
usa Secure e nome `__Host-focuslist_session`. Não há JWT ou armazenamento no
cliente além do cookie. Cada acesso consulta validade, expiração, revogação e
tipo REAL no PostgreSQL. Login com cookie anterior o revoga e emite novo token.
Logout revoga apenas a sessão atual. Respostas autenticadas usam `no-store`.

## Isolamento e limites desta etapa

Áreas exigem `userId` no banco; criação usa exclusivamente o contexto obtido da
sessão. Consultas e escritas de Área/List/Task/ChecklistItem/Link verificam o
proprietário na árvore `User → Area → List → Task → ChecklistItem/Link`.
Criação e troca de pai verificam propriedade no serviço e no `connect` Prisma.
Acesso individual a recurso alheio retorna `404`, inclusive para arquivar,
restaurar e excluir. Coleções e filtros retornam somente os recursos próprios.
Foram preservadas as regras existentes de arquivar antes da exclusão.

Dashboard e Arquivados estão montados após a autenticação e seguem o fluxo
controller → service → repository → Prisma. Todas as consultas, contagens,
agregações, atalhos e detalhes são filtrados pelo proprietário da sessão,
inclusive `/archived/areas/:id`, `/archived/lists/:id` e
`/archived/tasks/:id`. Recursos alheios retornam `404`. O Dashboard exige
`today=AAAA-MM-DD` com data válida; filtros inválidos retornam `400`.

`server.ts` escuta somente `127.0.0.1`. A limitação de
tentativas atual é local, em memória (30 tentativas por IP em 15 minutos); antes
de exposição pública, revisar HTTPS/proxy e limitação compartilhada de abuso.
Registros de sessões vencidas/revogadas são rejeitados imediatamente; limpeza
periódica desses registros ainda não foi implementada.

CORS aceita credenciais apenas para `http://localhost:5173` e
`http://127.0.0.1:5173` em desenvolvimento, ou uma origem exata definida por
`FRONTEND_ORIGIN`. Em produção, não há origem padrão, e a origem configurada
deve usar HTTPS. Nenhum `.env` foi editado. Origens externas e requisições
marcadas como cross-site são rejeitadas no servidor; corpos de escrita usam
JSON com limite de 32 KiB. Frontend e backend devem usar o mesmo site para a
política de cookies Lax. Erros inesperados retornam mensagem genérica sem SQL,
stack, dados Prisma ou credenciais.

O cadastro duplicado retorna erro genérico, mas o contraste `201`/`400` ainda
permite inferir que um endereço já está cadastrado. Isso é uma limitação do
cadastro síncrono com rejeição de duplicidade; não foi adicionada confirmação
por e-mail para mascará-la. O login evita essa distinção em mensagem e trabalho
criptográfico, com limitação básica de tentativas.

## Migration e testes

As migrations `20261026120000_multiuser_foundation` e
`20261026130000_require_area_owner` estão aplicadas no PostgreSQL local.
A segunda torna `Area.userId` NOT NULL, sem backfill nem exclusão de registros;
falha caso existam Áreas sem proprietário. Em banco com dados legados, a
vinculação deve ser autorizada e concluída antes dessa migration. Migrations
já aplicadas não devem ser editadas.

Para repetir os testes controlados em PowerShell, dentro de `backend`:

```powershell
$env:FOCUSLIST_AUTH_TESTS = 'LOCAL_CONTROLLED'
npm run test:auth
```

A suíte exige PostgreSQL local e confirmação no ambiente do processo. Usa HTTP
real em porta efêmera, duas contas com e-mails aleatórios e remove exclusivamente
as contas/árvores criadas nessa execução, sem resetar banco ou sequências.
Inclui cadastro, login, logout, ausência de sessão, expiração, revogação,
rotação, cookies de produção, CORS, CSRF, campos extras, erros, hashes e
isolamento bidirecional de todos os cinco recursos, inclusive troca de pai,
Dashboard e Arquivados. Os testes escrevem e removem dados; sua execução
exige autorização para essas operações controladas.

## Benchmark

O seed atribui as Áreas a um proprietário sintético no banco isolado validado
pelas proteções existentes. Os scripts de medição ainda não incorporam
login/cookies e precisam de adaptação antes de medir os endpoints protegidos.
