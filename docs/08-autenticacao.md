# Autenticação e propriedade de Áreas

Contrato da implementação multiusuário do backend. O fluxo DEMO e sua
transferência de dados estão documentados em [09-demo.md](09-demo.md).
O Perfil está documentado em [10-perfil.md](10-perfil.md).

## Contrato HTTP

| Método | Rota | Corpo / resposta |
| --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password, confirmPassword }` → `201 { user }` |
| POST | `/auth/login` | `{ email, password }` → `200 { user }` e cookie de sessão |
| GET | `/auth/session` | Sessão válida → `200 { user }`; caso contrário, `401` |
| POST | `/auth/logout` | Sem corpo ou `{}` → `204`, revoga a sessão atual e apaga o cookie |

Cadastro convencional não inicia sessão automaticamente; o cadastro vindo da Demo
segue o contrato de [09-demo.md](09-demo.md). O cadastro retorna `id`, `name`, `email` e
`createdAt`; login e sessão incluem tipo, contexto Demo e preferências/foto da conta REAL. Login inválido retorna a mesma mensagem para
conta ausente e senha incorreta. E-mail é normalizado com trim/lowercase.
Nome deve ter de 1 a 100 caracteres, sem controles; senha, de 8 a 32 caracteres
(até 128 bytes), sem truncamento nem trim. A confirmação deve ser idêntica.
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
tipo REAL ou DEMO não expirada no PostgreSQL. Login com cookie anterior o revoga e emite novo token.
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

Em produção, a Vercel chama diretamente a Function Express; `server.ts` permanece
somente para execução local. O middleware mantém uma defesa em memória de 30
tentativas por IP em 15 minutos, usando o IP fornecido pela Vercel. Regras de
Rate Limit do Vercel Firewall protegem as rotas sensíveis na borda.
Registros de sessões vencidas/revogadas são rejeitados imediatamente; limpeza
periódica desses registros ainda não foi implementada.

CORS aceita credenciais apenas para `http://localhost:5173` e
`http://127.0.0.1:5173` em desenvolvimento, ou uma origem exata definida por
`FRONTEND_ORIGIN`. Na Vercel, frontend e API usam a mesma origem HTTPS. No desenvolvimento, `FOCUSLIST_LAN_ORIGIN` permite uma origem LAN exata adicional. Origens externas e requisições
marcadas como cross-site são rejeitadas no servidor; corpos de escrita usam
JSON com limite de 32 KiB. Frontend e backend devem usar o mesmo site para a
política de cookies Lax. Erros inesperados retornam mensagem genérica sem SQL,
stack, dados Prisma ou credenciais. O servidor registra somente método, rota declarada, categoria e código Prisma sanitizados.

O cadastro duplicado informa que o e-mail já está cadastrado. O contraste `201`/`400` também
permite inferir que um endereço já está cadastrado. Isso é uma limitação do
cadastro síncrono com rejeição de duplicidade; não foi adicionada confirmação
por e-mail para mascará-la. O login evita essa distinção em mensagem e trabalho
criptográfico, com limitação básica de tentativas.

## Migration e testes

As migrations de fundação são `20261026120000_multiuser_foundation` e
`20261026130000_require_area_owner`.
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

## Recuperação de senha

`POST /auth/forgot-password` recebe `{ email }` e retorna `202` com a mensagem
"Se existir uma conta com esse e-mail, enviaremos as instruções." tanto para
conta REAL existente quanto ausente. A resposta não espera o Resend. Erros de
envio geram somente um log genérico, sem destinatário, token, chave ou resposta
do provedor. Formato de e-mail inválido e campos extras continuam retornando `400`.
No frontend, a confirmação é "Confira seu e-mail", seguida de "As instruções
para redefinir sua senha serão enviadas para o endereço informado."

`POST /auth/reset-password` recebe `{ token, password, confirmPassword }`.
Token inválido, usado ou expirado retorna `400` com a mesma mensagem. Sucesso
retorna `200`, limpa o cookie e exige novo Login. A senha usa o mesmo scrypt e
a mesma regra de 8–32 caracteres do cadastro. O frontend limpa seu estado de
autenticação e apresenta a confirmação com botão para `/login`. Links inválidos,
expirados ou usados mostram um estado próprio com acesso a `/recuperar-senha`.

A tabela `PasswordReset` mantém um registro por usuário, com SHA-256 de 32 bytes
aleatórios, validade de 30 minutos e `usedAt`. Novo pedido após 60 segundos
substitui o link anterior. Pedidos repetidos durante esse intervalo recebem a
mesma resposta neutra, sem novo envio. Os dois endpoints usam também o limitador
existente de 30 requisições por IP/15 minutos, compartilhado com Login/Cadastro.

Consumo condicional do token, troca da senha e revogação de todas as sessões
ocorrem na mesma transação. O bloqueio da linha de User serializa redefinições,
emissões de token e criação de sessões. Login revalida o hash dentro desse
bloqueio para impedir sessão criada com senha antiga após uma redefinição.
A troca de e-mail invalida recuperações pendentes na mesma transação; a emissão
revalida o endereço sob o bloqueio da conta para impedir envio concorrente ao endereço antigo.
Os testes sem banco verificam esse contrato com transporte Prisma simulado;
eles não substituem um teste de integração em PostgreSQL após a migration.

### Configuração manual antes do envio real

1. No [Resend Domains](https://resend.com/domains), cadastrar seu domínio ou
   subdomínio remetente. No provedor DNS, publicar **exatamente os registros
   SPF/DKIM e demais registros que o Resend indicar**. Aguardar o domínio ficar
   verificado e habilitado para envio. Não substituir um SPF existente sem
   compatibilizá-lo com os outros remetentes.
2. Criar uma API key no Resend com permissão de envio, preferencialmente restrita
   ao domínio verificado. Guardar somente no ambiente do backend como
   `RESEND_API_KEY`; nunca usar variável `VITE_*`, código ou repositório.
3. Definir `RESEND_FROM_EMAIL`, por exemplo `FocusList <acesso@seu-dominio.com>`,
   usando o domínio verificado. O endereço de exemplo não envia mensagens reais.
4. Definir `FRONTEND_ORIGIN` com a origem exata do frontend, sem caminho ou barra
   final. Em desenvolvimento: `http://localhost:5173`; em produção: a origem
   HTTPS real. O backend já usa essa variável para CORS. Manter frontend e backend
   no mesmo site conforme a política atual de cookies. Sem essa variável em
   desenvolvimento, o envio usa `http://localhost:5173`, como o frontend local.
5. Desabilitar rastreamento de cliques no domínio usado para recuperação para
   preservar o link e seu fragmento. O link é
   `FRONTEND_ORIGIN/redefinir-senha#token=...`; não trocar o token para query string.
   A tela lê o fragmento em memória e o remove do endereço/histórico atual.
6. As migrations versionadas já estão aplicadas no Supabase. Em novos ambientes,
   aplicar somente `prisma migrate deploy --config prisma7.config.ts` e gerar o
   cliente. A rota `/redefinir-senha` é servida pela SPA na Vercel.
7. Testar com uma conta REAL e caixa postal sob seu controle, conferir o envio
   no painel do Resend e concluir o fluxo. Sem domínio próprio, o remetente de
   teste do Resend tem restrições de destinatário; não serve para validar envio
   para usuários em geral.

Integração via [API HTTP oficial](https://resend.com/docs/api-reference/emails/send-email),
sem dependência nova. O e-mail inclui HTML com estilos inline, tabelas de
apresentação e alternativa em texto. A marca oficial fica em
`backend/assets/focuslist-mark-email.png`, versão destinada ao e-mail,
incorporada por CID para funcionar sem endereço público de imagem.
O envio usa timeout de 10 segundos, chave de idempotência
por mensagem e no máximo cinco envios simultâneos por processo. A Function usa
`waitUntil` para manter o envio do Resend após a resposta HTTP. Não há fila durável
nem retry automático: falha ou saturação pode exigir novo pedido após 60 segundos.
A proteção compartilhada contra abuso é aplicada pelo Vercel Firewall.

Para testes relacionados, sem banco nem envio externo, executar em `backend`:

```powershell
npm run test:password-recovery
```

Integração complementar de recuperação com HTTP e PostgreSQL reais, usando
somente conta temporária e token de fixture, sem envio de e-mail:

```powershell
$env:FOCUSLIST_AUTH_TESTS = 'LOCAL_CONTROLLED'
node --test tests/password-recovery-postgres.test.mjs
```

Essa integração não confirma recebimento de e-mail nem substitui o teste completo
com destinatário autorizado e link recebido do Resend.

O histórico Git preserva a evolução e as validações anteriores. Resultados locais
não substituem a validação do ambiente publicado.

## Benchmark

O seed atribui as Áreas a um proprietário sintético no banco isolado validado
pelas proteções existentes. Os scripts de medição ainda não incorporam
login/cookies e precisam de adaptação antes de medir os endpoints protegidos.
