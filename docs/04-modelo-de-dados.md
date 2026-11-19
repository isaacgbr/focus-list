# Modelo de dados

O PostgreSQL é acessado pelo Prisma 7. Todas as chaves primárias são inteiros autoincrementais; timestamps registram criação, atualização, conclusão, arquivamento, expiração e revogação conforme a entidade.

## Relações

```text
User
├── Session ── DemoTransfer
├── PasswordReset
└── Area ── List ── Task ── ChecklistItem
                     └────── Link
```

| Entidade | Papel |
| --- | --- |
| `User` | Identidade REAL ou DEMO, preferências e chave do avatar |
| `Session` | Sessão persistente com hash do token, expiração e revogação |
| `PasswordReset` | Token por hash, validade e consumo único |
| `DemoTransfer` | Capacidade de importar uma Demo vinculada à sessão REAL |
| `Area` | Raiz da organização e fronteira de ownership |
| `List` | Agrupamento pertencente a uma Área |
| `Task` | Trabalho, prioridade, prazo, conclusão e arquivamento |
| `ChecklistItem` | Item concluível pertencente a uma Tarefa |
| `Link` | Referência HTTP/HTTPS pertencente a uma Tarefa |

## Integridade

- `Area.userId` é obrigatório; o usuário autenticado é a única fonte dessa identidade.
- Excluir um `User` com Áreas é impedido por `onDelete: Restrict`.
- Relações abaixo de Área, sessões, recuperação e transferência usam cascata.
- `email`, hashes de token, `demoUserId` e `sessionId` possuem unicidade adequada ao fluxo.
- `defaultView` aceita `list` ou `cards`; prioridade aceita `LOW`, `MEDIUM` ou `HIGH`.
- Regras condicionais de contas REAL/DEMO e normalização de e-mail são reforçadas pelas migrations SQL.

## Ownership e arquivamento

Todas as consultas do domínio percorrem `User → Area → List → Task → ChecklistItem/Link`. IDs são visíveis nas URLs, mas nunca funcionam como autorização: recursos de outro usuário não são retornados ou alterados.

`archivedAt` existe em Área, Lista e Tarefa. Arquivar um pai não altera os filhos; a visibilidade é derivada da hierarquia. `completedAt` é controlado pela transição de conclusão da Tarefa.

`avatarKey` guarda somente a chave do objeto no Supabase Storage. Nenhuma imagem ou URL pública é armazenada no PostgreSQL.
