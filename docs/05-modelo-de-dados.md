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
| Título | ✅ |
| Descrição | |
| Cor | |
| Ícone | |
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
| Título | ✅ |
| Descrição | |
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
| Título | ✅ |
| Descrição | |
| completed | ✅ *(inicia como false)* |
| completedAt | |
| Prioridade | |
| Prazo | |
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
| Título | ✅ |
| completed | ✅ |
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
| Título | ✅ |
| URL | ✅ |
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

------------------------------------------------------------------------

## Área Avulsas

A Área **Avulsas** segue o mesmo modelo das demais Áreas.

Internamente, ela possui uma **Lista Avulsas** (oculta), utilizada apenas para manter a estrutura do sistema consistente.

O usuário interage apenas com a Área Avulsas e suas tarefas.

------------------------------------------------------------------------

## Observações

Este documento representa o modelo conceitual do projeto e serve como base para a implementação das entidades no banco de dados.

------------------------------------------------------------------------

**Versão:** 0.2