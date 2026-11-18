# Modelo de Dados

## Relações

```text
User 1 ── N Area 1 ── N List 1 ── N Task 1 ── N ChecklistItem
     └── N Session                    └────── 1 ── N Link
```

Todas as chaves primárias são inteiros autoincrementais. A relação de Área com User é obrigatória e usa `onDelete: Restrict`: excluir um usuário com Áreas é impedido, preservando seus dados. As demais relações usam exclusão em cascata no banco.

## Implementação multiusuário

O schema e a migration `20261026120000_multiuser_foundation` preparam REAL e DEMO na mesma hierarquia. A migration `20261026130000_require_area_owner` torna o proprietário de Área obrigatório. As migrations versionadas estão aplicadas no PostgreSQL do Supabase. Cadastro, login, sessão persistida e logout estão implementados para REAL, com isolamento de todas as rotas de domínio, Dashboard e Arquivados. O fluxo DEMO está documentado em [09-demo.md](09-demo.md).

### User

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `Int` | chave primária automática |
| `type` | `UserType` | obrigatório, `REAL` ou `DEMO`, sem padrão implícito |
| `name` | `String?` | obrigatório e não vazio para REAL; opcional para DEMO |
| `email` | `String?` | obrigatório para REAL, único, minúsculo e sem espaços; nulo para DEMO |
| `passwordHash` | `String?` | hash obrigatório e não vazio para REAL; nulo para DEMO |
| `expiresAt` | `DateTime?` | nulo para REAL; exatamente `createdAt + 24 horas` para DEMO |
| `createdAt` | `DateTime` | automático |
| `updatedAt` | `DateTime` | automático |

Os campos de credenciais são opcionais no Prisma para acomodar DEMO. Os CHECKs SQL `User_type_fields_check` e `User_email_normalized_check` impõem as regras condicionais no PostgreSQL. A autenticação normaliza o e-mail antes da gravação; o banco rejeita valores fora desse formato. O índice único permite várias DEMOs com e-mail nulo. O índice `(type, expiresAt)` prepara a busca de DEMOs expiradas.

Não existem campos de senha pura ou confirmação de senha no banco. Senhas usam scrypt assíncrono com salt aleatório; os parâmetros e o contrato estão em [08-autenticacao.md](08-autenticacao.md). A recuperação usa `PasswordReset` com token por hash, expiração e consumo único. O cadastro não exige confirmação de e-mail.

### Session

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `Int` | chave primária automática; não é a credencial da sessão |
| `tokenHash` | `String` / `CHAR(64)` | único; somente SHA-256 hexadecimal minúsculo do token aleatório |
| `userId` | `Int` | User obrigatório; exclusão do usuário remove suas sessões |
| `createdAt` | `DateTime` | automático |
| `expiresAt` | `DateTime` | obrigatório e posterior a `createdAt` |
| `revokedAt` | `DateTime?` | nulo enquanto não revogada |

O banco não armazena o token original. Há índices para busca pelo hash único, consulta/revogação por `(userId, revokedAt)` e expiração por `expiresAt`. Os CHECKs `Session_tokenHash_format_check` e `Session_expiration_check` ficam na migration SQL, pois não são representados no schema Prisma. Futuras migrations devem preservá-los.

O login gera tokens criptograficamente aleatórios de 32 bytes, persiste apenas SHA-256 e envia o token exclusivamente no cookie HttpOnly/Lax (Secure em produção). A autenticação verifica revogação, expiração e tipo REAL/DEMO a cada requisição. Nenhum hash ou token aparece no JSON. O fluxo DEMO respeita a expiração absoluta de 24 horas do usuário, inclusive nas sessões.

### Migrations e propriedade

1. A fundação adiciona `Area.userId` inicialmente anulável, sem valor padrão, e cria User/Session, relações, índices e CHECKs. Não atribui dados automaticamente.
2. A migration seguinte aplica `NOT NULL`. Falha se houver Áreas sem proprietário, sem inventar uma conta nem excluir dados. Em outro banco com dados legados, a vinculação exige autorização e deve ocorrer antes dessa migration.
3. Migrations já aplicadas devem permanecer intactas; alterações futuras exigem novas migrations. Os CHECKs SQL também devem ser preservados.
4. A propriedade vem exclusivamente da sessão validada pelo servidor. Todas as consultas e escritas do domínio, Dashboard e Arquivados usam esse proprietário; criação e troca de pai também verificam a propriedade no vínculo Prisma.

Os corpos HTTP rejeitam campos desconhecidos, incluindo `userId`, `user` e escritas aninhadas. Os repositórios passam somente os campos permitidos em criação/edição. List, Task, ChecklistItem e Link não possuem `userId`; herdam o proprietário pela hierarquia. Índices nas chaves `Area.userId`, `List.areaId`, `Task.listId`, `ChecklistItem.taskId` e `Link.taskId` suportam essa navegação.

## Area

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `Int` | chave primária automática |
| `title` | `String` | obrigatório |
| `description` | `String?` | opcional |
| `color` | `String?` | opcional |
| `icon` | `String?` | opcional |
| `createdAt` | `DateTime` | automático |
| `updatedAt` | `DateTime` | automático |
| `archivedAt` | `DateTime?` | nulo enquanto ativa |
| `userId` | `Int` | proprietário obrigatório, definido pela sessão; sem atribuição automática |

## List

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `Int` | chave primária automática |
| `title` | `String` | obrigatório |
| `description` | `String?` | opcional |
| `createdAt` | `DateTime` | automático |
| `updatedAt` | `DateTime` | automático |
| `archivedAt` | `DateTime?` | nulo enquanto ativa |
| `areaId` | `Int` | Área obrigatória |

## Task

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `Int` | chave primária automática |
| `title` | `String` | obrigatório |
| `description` | `String?` | opcional |
| `dueDate` | `DateTime?` | opcional |
| `priority` | `Priority?` | `LOW`, `MEDIUM` ou `HIGH` |
| `completed` | `Boolean` | padrão `false` |
| `completedAt` | `DateTime?` | opcional |
| `createdAt` | `DateTime` | automático |
| `updatedAt` | `DateTime` | automático |
| `archivedAt` | `DateTime?` | nulo enquanto ativa |
| `listId` | `Int` | Lista obrigatória |

## ChecklistItem

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `Int` | chave primária automática |
| `title` | `String` | obrigatório |
| `completed` | `Boolean` | padrão `false` |
| `createdAt` | `DateTime` | automático |
| `taskId` | `Int` | Tarefa obrigatória |

## Link

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `Int` | chave primária automática |
| `title` | `String` | obrigatório |
| `url` | `String` | obrigatório |
| `createdAt` | `DateTime` | automático |
| `taskId` | `Int` | Tarefa obrigatória |

## Semântica de arquivamento

`archivedAt` existe apenas em Área, Lista e Tarefa. Arquivar um pai registra a data somente no pai; os descendentes são ocultados por consultas que consideram toda a hierarquia. Por isso, um filho com `archivedAt = null` pode estar invisível enquanto seu pai estiver arquivado.

As tarefas seguem a hierarquia Área → Lista → Tarefa.

Não existe entidade para Tarefa Avulsa: toda Tarefa possui `listId` obrigatório e pertence a uma Lista.

## Recuperação, Demo e Perfil

- `PasswordReset`: um registro por usuário, token SHA-256 único, expiração e `usedAt`.
- `DemoTransfer`: vínculo único entre usuário Demo e sessão REAL criada no cadastro; `resolvedAt` registra a decisão.
- `User.avatarKey`: chave opcional do objeto JPEG no bucket privado do Supabase Storage; `defaultView`: `list` ou `cards`, protegido por CHECK.

O schema e as migrations são a referência para campos e índices completos.
