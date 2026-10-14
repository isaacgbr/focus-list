# Modelo de Dados

## Relações

```text
Area 1 ── N List 1 ── N Task 1 ── N ChecklistItem
                           └────── 1 ── N Link
```

Todas as chaves primárias são inteiros autoincrementais. As relações obrigatórias usam exclusão em cascata no banco.

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

O modelo não possui entidade especial para Avulsas e não cria automaticamente uma Área ou Lista com esse nome.
