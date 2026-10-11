# Documentação do Projeto

## 05. Modelo de Dados

Este documento descreve o modelo conceitual de dados do projeto.

------------------------------------------------------------------------

## Visão Geral

```text
Área
    │
    └── possui várias Listas
            │
            └── possui várias Tarefas
                    ├── pode possuir vários Itens de Checklist
                    └── pode possuir vários Links
```

------------------------------------------------------------------------

## Área

### Objetivo

Representar um contexto de organização (ex.: Faculdade, Trabalho, Pessoal).

### Campos

| Campo | Obrigatório |
|-------|:-----------:|
| id | ✅ |
| title | ✅ |
| description | |
| color | |
| icon | |
| createdAt | ✅ *(automático)* |
| updatedAt | ✅ *(automático)* |

------------------------------------------------------------------------

## Lista

### Objetivo

Agrupar tarefas relacionadas dentro de uma Área.

### Campos

| Campo | Obrigatório |
|-------|:-----------:|
| id | ✅ |
| areaId | ✅ |
| title | ✅ |
| description | |
| createdAt | ✅ *(automático)* |
| updatedAt | ✅ *(automático)* |

### Relação

- Pertence obrigatoriamente a uma Área.

------------------------------------------------------------------------

## Tarefa

### Objetivo

Representar uma atividade que o usuário deseja realizar ou acompanhar.

### Campos

| Campo | Obrigatório |
|-------|:-----------:|
| id | ✅ |
| listId | ✅ |
| title | ✅ |
| description | |
| completed | ✅ *(inicia como false)* |
| completedAt | |
| priority | |
| dueDate | |
| createdAt | ✅ *(automático)* |
| updatedAt | ✅ *(automático)* |

### Relação

- Pertence obrigatoriamente a uma Lista.

------------------------------------------------------------------------

## Item de Checklist

### Objetivo

Representar uma etapa da tarefa.

### Campos

| Campo | Obrigatório |
|-------|:-----------:|
| id | ✅ |
| taskId | ✅ |
| title | ✅ |
| completed | ✅ *(inicia como false)* |
| createdAt | ✅ *(automático)* |

### Relação

- Pertence obrigatoriamente a uma Tarefa.

------------------------------------------------------------------------

## Link

### Objetivo

Relacionar materiais de apoio à tarefa.

### Campos

| Campo | Obrigatório |
|-------|:-----------:|
| id | ✅ |
| taskId | ✅ |
| title | ✅ |
| url | ✅ |
| createdAt | ✅ *(automático)* |

### Relação

- Pertence obrigatoriamente a uma Tarefa.

------------------------------------------------------------------------

## Relações

- Uma Área possui várias Listas.
- Uma Lista pertence a uma Área.
- Uma Lista possui várias Tarefas.
- Uma Tarefa pertence a uma Lista.
- Uma Tarefa pode possuir vários Itens de Checklist.
- Uma Tarefa pode possuir vários Links.

As relações obrigatórias utilizam exclusão em cascata no banco:

- Excluir uma Área remove suas Listas e todos os registros descendentes.
- Excluir uma Lista remove suas Tarefas, Itens de Checklist e Links.
- Excluir uma Tarefa remove seus Itens de Checklist e Links.

------------------------------------------------------------------------

## Observações

Os IDs são inteiros autoincrementais. A prioridade, quando informada,
aceita `LOW`, `MEDIUM` ou `HIGH`. O modelo atual não diferencia uma Área
ou Lista "Avulsas" por campo, restrição ou registro criado
automaticamente.

------------------------------------------------------------------------

**Versão:** 0.3
