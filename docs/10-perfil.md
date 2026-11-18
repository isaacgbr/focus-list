# Perfil da conta FocusList

`/app/perfil` fica disponível pelo nome/avatar na sidebar somente para contas REAL.
A página contém identificação, Dados da conta, Segurança, Preferências e Sessão.
DEMO não recebe link, é redirecionada no frontend e recebe 403 nos endpoints.

## Persistência

Migration aditiva: `20261029180000_user_profile` adiciona `avatarKey` opcional
e `defaultView` com padrão `list`, validado por CHECK (`list`/`cards`).
`createdAt` já existia e é exibido como a data real de criação.

Em um banco novo, aplicar com o Prisma já instalado, a partir de `backend`:

```powershell
node_modules/.bin/prisma.cmd migrate deploy --config prisma7.config.ts
```

A migration já está aplicada no Supabase de produção. Não há reset, backfill manual
ou alteração de credenciais de contas existentes; o cliente Prisma é gerado no build.

## Avatar privado

O navegador decodifica JPG/PNG/WebP de até 5 MB
e 20 megapixels, permite zoom/posição e rasteriza um recorte JPEG de 256x256.
O servidor limita a imagem a 128 KiB e valida base64, assinatura JPEG e dimensões.
Essa validação de estrutura não é um antivírus ou decodificador completo de JPEG.

O backend gera um UUID, grava o JPEG no bucket privado indicado por
`SUPABASE_STORAGE_BUCKET` e persiste somente `avatarKey` no PostgreSQL. A secret
key do Supabase existe apenas na Function; o frontend nunca acessa o bucket.
Leitura e entrega da imagem passam pelo endpoint autenticado do backend.

Na substituição, o novo objeto é enviado antes da atualização do banco. Se a
atualização falhar, o backend tenta remover o novo objeto; após sucesso, tenta
excluir o antigo. Na remoção, a referência é desvinculada antes da exclusão do
objeto, evitando referência persistida para arquivo inexistente. Falhas tardias
de limpeza são registradas de forma sanitizada e não desfazem um perfil válido.

Leitura exige sessão REAL e sempre usa a foto da própria conta, com `no-store`,
`image/jpeg`, `nosniff` e CSP restritiva. Se a foto estiver ausente, a UI usa a inicial.
Arquivos remanescentes em `backend/uploads/` são apenas legado local ignorado pelo Git.

## Segurança e sessão

Identidade vem exclusivamente do middleware de autenticação. DTOs rejeitam userId,
tipo, hash ou campos extras. E-mail usa o mesmo normalizador do cadastro, índice
único do banco e exige senha atual. Uma mudança efetiva invalida recuperações
pendentes na mesma transação, preservando as sessões. Falha na invalidação
desfaz a troca. Não há confirmação por e-mail nesta versão.

Senha usa exatamente a regra existente de 8–32 pontos Unicode (até 128 bytes) e
o mesmo scrypt. Troca bloqueia a linha do usuário, revalida sessão e hash esperado,
atualiza senha, revoga as outras sessões e invalida recuperação pendente em uma
única transação. A sessão atual e sessões de outras contas são preservadas.
O lock é o mesmo do login/recuperação para rejeitar verificações de senha obsoletas.
O fluxo de recuperação existente continua revogando todas as sessões.

Dados públicos do Perfil não incluem IDs nem hashes. O contexto recebe os dados
salvos sem refazer login. Sair reutiliza `useAuth().logout()` e `/auth/logout`.

## Visualização padrão

`list` mantém a experiência anterior das contas existentes. `cards` ou `list` vem
da sessão REAL ao montar AreaLists/ListTasks, inclusive nos detalhes arquivados que
possuem esses controles. A alternância durante o uso continua local à tela;
apenas Salvar preferência no Perfil muda o padrão persistido. DEMO continua Lista.

## API

Todos os endpoints abaixo exigem sessão REAL e usam Cache-Control: no-store.

| Método | Endpoint | Corpo |
| --- | --- | --- |
| GET | /profile | — |
| PATCH | /profile | name e/ou email; currentPassword obrigatório para email |
| POST | /profile/password | currentPassword, newPassword, confirmPassword |
| PATCH | /profile/preferences | defaultView: list ou cards |
| GET | /profile/avatar | — |
| PUT | /profile/avatar | image: base64 JPEG |
| DELETE | /profile/avatar | — |

## Validação

Sem banco: `npm run test:profile` em backend e frontend. Backend executa HTTP,
serviços, repositório e scrypt reais com Prisma e Storage substituídos por fakes;
nenhum objeto real é enviado. Frontend executa a
validação usada no formulário, bloqueio de envio com confirmação divergente,
padrão de visualização e geometria do recorte, sem abrir navegador.

Integração PostgreSQL exige autorização explícita antes de executar:

```powershell
$env:FOCUSLIST_AUTH_TESTS = 'LOCAL_CONTROLLED'
npm run test:profile:postgres
```

O teste recusa banco remoto, cria contas/sessões temporárias e remove exclusivamente
as fixtures capturadas na execução. Não envia e-mails. As suítes existentes de
autenticação, DEMO e recuperação PostgreSQL também exigem essa autorização.
Validação visual não foi automatizada; depende de solicitação explícita.
