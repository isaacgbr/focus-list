# Autenticação e propriedade de Áreas

Contrato da implementação multiusuário do backend. O fluxo DEMO e Perfil
permanecem fora desta etapa.

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
6. Após revisão e autorização para alterar o banco, aplicar a migration preparada
   com `npx prisma migrate deploy --config prisma7.config.ts` em `backend`,
   e gerar o cliente com `npx prisma generate --config prisma7.config.ts`.
   A migration foi revisada e aplicada no PostgreSQL local em 28/10/2026,
   por solicitação explícita. Reiniciar o backend depois de
   configurar as variáveis. No hosting, a rota `/redefinir-senha` deve servir a
   SPA, assim como as outras rotas React.
7. Testar com uma conta REAL e caixa postal sob seu controle, conferir o envio
   no painel do Resend e concluir o fluxo. Sem domínio próprio, o remetente de
   teste do Resend tem restrições de destinatário; não serve para validar envio
   para usuários em geral.

Integração via [API HTTP oficial](https://resend.com/docs/api-reference/emails/send-email),
sem dependência nova. O e-mail inclui HTML com estilos inline, tabelas de
apresentação e alternativa em texto. A marca oficial fica em
`backend/assets/focuslist-mark.png`, cópia de `frontend/public/focuslist-mark.png`,
incorporada por CID para funcionar sem endereço público de imagem.
O envio usa timeout de 10 segundos, chave de idempotência
por mensagem e no máximo cinco envios simultâneos por processo. Não há fila
durável nem retry automático: falha, saturação ou reinício durante envio pode
exigir novo pedido após 60 segundos. O limitador por IP continua local; múltiplas
instâncias precisam de proteção compartilhada no proxy, como na autenticação atual.

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

Em 28/10/2026, o fluxo completo foi validado localmente com destinatário
autorizado: envio real pelo Resend, recebimento confirmado no Gmail, link
recebido aberto no frontend, redefinição pela interface e novo Login. Duas
sessões independentes antes válidas passaram a retornar `401`; reutilização
do token retornou `400`, senha antiga retornou `401` e nova senha, `200`.
O PostgreSQL confirmou consumo do token e somente a nova sessão ativa.

## Benchmark

O seed atribui as Áreas a um proprietário sintético no banco isolado validado
pelas proteções existentes. Os scripts de medição ainda não incorporam
login/cookies e precisam de adaptação antes de medir os endpoints protegidos.
